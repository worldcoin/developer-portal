import { getEthAddressFromKMS } from "@/api/helpers/kms-eth";
import { POST as switchMode } from "@/api/hasura/switch-to-self-managed";
import { POST as toggle } from "@/api/hasura/toggle-rp-active";
import { submitManagedSignerRotation } from "@/api/helpers/rp-registration-flows";
import { POST as mcp } from "@/api/mcp";
import { generateHashedSecret } from "@/api/helpers/utils";
import { POST as register } from "@/api/hasura/register-rp";
import { POST as retry } from "@/api/hasura/rp-retry";
import { GET as status } from "@/api/v4/rp-status/[rp_id]";
import { submitManagedRpRegistration } from "@/api/helpers/rp-registration-flows";
import { RP_RESERVATION_SIGNER } from "@/api/helpers/rp-id-backfill";
import { generateRpIdString, WORLD_CHAIN_ID } from "@/api/helpers/rp-utils";
import { hashUserOperation, UserOperation } from "@/api/helpers/user-operation";
import { print, DocumentNode } from "graphql";
import { GraphQLClient } from "graphql-request";
import { Interface } from "ethers";
import { NextRequest } from "next/server";
import RP_ABI from "@/api/helpers/abi/rp-registry.json";
import SAFE_ABI from "@/api/helpers/abi/safe-4337.json";

// #region Mocks: only GraphQL, KMS, RPC and logging.
const request = jest.fn();
const readRp = jest.fn();
const send = jest.fn();
const receipt = jest.fn();
const sign = jest.fn();
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn(async () => ({ request })),
}));
jest.mock("@/api/helpers/temporal-rpc", () => ({
  getRpFromContract: (...args: unknown[]) => readRp(...args),
  getRpNonceFromContract: jest.fn().mockResolvedValue(0n),
  getERC20Allowance: jest.fn().mockResolvedValue((1n << 256n) - 1n),
  sendUserOperation: (...args: unknown[]) => send(...args),
  getUserOperationReceipt: (...args: unknown[]) => receipt(...args),
}));
jest.mock("@/api/helpers/kms", () => ({
  getKMSClient: jest.fn().mockResolvedValue({}),
  scheduleKeyDeletion: jest.fn(),
}));
jest.mock("@/api/helpers/kms-eth", () => ({
  getEthAddressFromKMS: jest
    .fn()
    .mockResolvedValue("0x1111111111111111111111111111111111111111"),
  signEthDigestWithKms: (...args: unknown[]) => sign(...args),
}));
jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test data
const appId = "app_bacfff00000000000000000000000001";
const rpId = generateRpIdString(appId);
const manager = "0x1111111111111111111111111111111111111111";
const signer = "0x2222222222222222222222222222222222222222";
const production = "0x3333333333333333333333333333333333333333";
const staging = "0x4444444444444444444444444444444444444444";
const client = { request } as unknown as GraphQLClient;
const apiKeyId = "key_bacfff00000000000000000000000001";
const apiSecret = generateHashedSecret(apiKeyId);
const apiKey = `api_${Buffer.from(`${apiKeyId}:${apiSecret.secret}`).toString("base64").replace(/=/g, "")}`;
let mcpRegistration: ReturnType<typeof makeDbRecord> | null;
const callMcp = (name: string) =>
  mcp(
    new NextRequest("http://localhost/api/mcp", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name, arguments: { app_id: appId } },
      }),
    }),
  );
const onChain = (overrides = {}) => ({
  initialized: true,
  active: true,
  manager,
  signer: RP_RESERVATION_SIGNER,
  oprfKeyId: 1n,
  unverifiedWellKnownDomain: "",
  ...overrides,
});
const makeDbRecord = (overrides: Record<string, unknown> = {}) => ({
  rp_id: rpId,
  app_id: appId,
  mode: "managed",
  status: "pending",
  staging_status: "pending",
  signer_address: signer,
  manager_kms_key_id: "shared-manager",
  is_unique_manager_key: false,
  operation_hash: "0xproduction",
  staging_operation_hash: "0xstaging",
  created_at: "2000-01-01",
  updated_at: "2000-01-01",
  app: {
    id: appId,
    team_id: "team_test",
    deleted_at: null,
    status: "active",
    is_archived: false,
    app_metadata: [{ name: "Test App" }],
  },
  ...overrides,
});
let backfill: Record<string, unknown>;
let dbRecord: ReturnType<typeof makeDbRecord>;
let appDeleted: boolean;
let permitted: boolean;
let attemptWrites: Array<{
  registry: string;
  hash: string | null;
  status: string;
}>;
const makeRequest = (action: string, input: object) =>
  new NextRequest(`http://localhost/api/hasura/${action}`, {
    method: "POST",
    headers: {
      Authorization: "Bearer local-test",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: { name: action },
      session_variables: { "x-hasura-user-id": "user_test" },
      input,
    }),
  });
const setup = () =>
  submitManagedRpRegistration({
    client,
    appId,
    signerAddress: signer,
    appName: "Test App",
    isStaging: false,
  });
const queryText = (document: unknown) =>
  typeof document === "string" ? document : print(document as DocumentNode);
async function graphql(document: unknown, variables: Record<string, any>) {
  const query = queryText(document);
  if (query.includes("McpAuthenticateTeam"))
    return {
      api_key_by_pk: {
        id: apiKeyId,
        api_key: apiSecret.hashed_secret,
        is_active: true,
        team_id: "team_test",
      },
    };
  if (query.includes("McpAppContext"))
    return {
      app:
        appDeleted || !permitted
          ? []
          : [
              {
                id: appId,
                name: "Test",
                is_staging: false,
                rp_registration: mcpRegistration ? [mcpRegistration] : [],
                app_metadata: [],
              },
            ],
    };
  if (query.includes("query RpBackfill"))
    return { rp_id_backfill_by_pk: backfill };
  if (query.includes("GetAppInfo"))
    return {
      app: appDeleted
        ? []
        : [{ id: appId, team_id: "team_test", is_staging: false }],
    };
  if (
    query.includes("CheckUserInApp") ||
    query.includes("CheckUserIsOwnerInApp")
  )
    return { team: permitted ? [{ id: "team_test" }] : [] };
  if (query.includes("query GetRpRegistration"))
    return query.includes("rp_registration_by_pk")
      ? { rp_registration_by_pk: dbRecord }
      : { rp_registration: [dbRecord] };
  if (query.includes("mutation ClaimRpRegistration"))
    return { insert_rp_registration_one: { rp_id: rpId } };
  if (query.includes("mutation SaveRpActivation")) {
    attemptWrites.push({
      registry: query.includes("staging_status:") ? "staging" : "production",
      hash: variables.hash,
      status: variables.status,
    });
    return { update_rp_registration: { affected_rows: appDeleted ? 0 : 1 } };
  }
  if (query.includes("mutation ClaimRpActivationRetry")) {
    const field = query.includes("staging_status:")
      ? "staging_status"
      : "status";
    const hashField =
      field === "status" ? "operation_hash" : "staging_operation_hash";
    const available =
      (dbRecord[field] === "failed" ||
        (dbRecord[field] == null && dbRecord[hashField] == null)) &&
      !appDeleted;
    if (available) dbRecord[field] = "pending";
    return { update_rp_registration: { affected_rows: available ? 1 : 0 } };
  }
  if (query.includes("mutation FinalizeRpBackfill"))
    return { update_rp_id_backfill: { affected_rows: 1 } };
  throw new Error(`Unexpected GraphQL operation: ${query}`);
}
// #endregion

beforeEach(async () => {
  jest.clearAllMocks();
  await global.RedisClient?.flushall();
  Object.assign(process.env, {
    RP_SETUP_PAUSED: "false",
    NEXT_PUBLIC_APP_ENV: "production",
    INTERNAL_ENDPOINTS_SECRET: "local-test",
    RP_REGISTRY_MANAGER_KMS_KEY_ID: "shared-manager",
    RP_REGISTRY_SAFE_OWNER_KMS_KEY_ID: "safe-owner",
    RP_REGISTRY_KMS_REGION: "us-east-1",
    RP_REGISTRY_CONTRACT_ADDRESS: production,
    RP_REGISTRY_STAGING_CONTRACT_ADDRESS: staging,
    RP_REGISTRY_SAFE_ADDRESS: manager,
    RP_REGISTRY_ENTRYPOINT_ADDRESS: manager,
    RP_REGISTRY_SAFE_4337_MODULE_ADDRESS: manager,
    RP_REGISTRY_DOMAIN_SEPARATOR: `0x${"11".repeat(32)}`,
    RP_REGISTRY_UPDATE_RP_TYPEHASH: `0x${"22".repeat(32)}`,
    RP_REGISTRY_STAGING_DOMAIN_SEPARATOR: `0x${"33".repeat(32)}`,
    RP_REGISTRY_STAGING_UPDATE_RP_TYPEHASH: `0x${"44".repeat(32)}`,
    CREDENTIAL_SCHEMA_ISSUER_REGISTRY_ADDRESS: manager,
  });
  backfill = {
    app_id: appId,
    rp_id: rpId,
    production_status: "reserved",
    staging_status: "reserved",
    production_request_id: null,
    staging_request_id: null,
  };
  dbRecord = makeDbRecord();
  mcpRegistration = null;
  appDeleted = false;
  permitted = true;
  attemptWrites = [];
  request.mockImplementation(graphql);
  sign.mockResolvedValue({ serialized: `0x${"11".repeat(65)}` });
  readRp.mockResolvedValue(onChain());
  receipt.mockResolvedValue(null);
  send.mockImplementation(async (op: UserOperation, entry: string) => {
    const hash = hashUserOperation(op, entry, WORLD_CHAIN_ID);
    expect(
      attemptWrites.some(
        (write) => write.hash === hash && write.status === "pending",
      ),
    ).toBe(true);
    const claim = request.mock.calls.find((call) =>
      queryText(call[0]).includes("mutation ClaimRpRegistration"),
    );
    if (claim)
      expect(claim[1]).toMatchObject({
        manager_kms_key_id: "shared-manager",
        is_unique_manager_key: false,
        signer_address: signer,
      });
    return { operationHash: hash };
  });
});

// #region Activation branching and uncertainty
describe("reserved RP activation", () => {
  it("fails closed when a worklist RP ID does not match its app", async () => {
    backfill.rp_id = "rp_0000000000000001";
    await expect(setup()).rejects.toThrow("does not match app");
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects incomplete activation configuration before claiming a registration", async () => {
    delete process.env.RP_REGISTRY_STAGING_CONTRACT_ADDRESS;
    expect(await setup()).toMatchObject({ ok: false, code: "config_error" });
    expect(
      request.mock.calls.some((call) =>
        queryText(call[0]).includes("mutation ClaimRpRegistration"),
      ),
    ).toBe(false);
  });

  it("leaves the reservation intact when the shared manager cannot be resolved", async () => {
    process.env.RP_REGISTRY_MANAGER_KMS_KEY_ID = "unavailable-test-key";
    jest
      .mocked(getEthAddressFromKMS)
      .mockRejectedValueOnce(new Error("KMS unavailable"));
    expect(await setup()).toMatchObject({ ok: false, code: "kms_error" });
    expect(send).not.toHaveBeenCalled();
    expect(
      request.mock.calls.some((call) =>
        queryText(call[0]).includes("mutation ClaimRpRegistration"),
      ),
    ).toBe(false);
  });

  it("uses manager signer updates for both reservations and saves the real signer first", async () => {
    const result = await setup();
    expect(result).toMatchObject({
      ok: true,
      status: "pending",
      stagingStatus: "pending",
    });
    expect(send).toHaveBeenCalledTimes(2);
    for (const [op] of send.mock.calls) {
      const safe = new Interface(SAFE_ABI).decodeFunctionData(
        "executeUserOp",
        op.callData,
      );
      const update = new Interface(RP_ABI).decodeFunctionData(
        "updateRp",
        safe[2],
      );
      expect(update[2].toLowerCase()).toBe(signer);
    }
  });

  it("can activate staging independently when production is claimed by another manager", async () => {
    backfill.production_status = "claimed_by_other";
    readRp.mockImplementation(async (_rp, address) =>
      onChain(address === production ? { manager: signer } : {}),
    );
    expect(await setup()).toMatchObject({
      ok: true,
      status: "failed",
      stagingStatus: "pending",
    });
    expect(send).toHaveBeenCalledTimes(1);
    const safe = new Interface(SAFE_ABI).decodeFunctionData(
      "executeUserOp",
      send.mock.calls[0][0].callData,
    );
    expect(safe[0].toLowerCase()).toBe(staging);
  });

  it("registers an unused registry independently of the reserved registry", async () => {
    backfill.staging_status = "unused";
    readRp.mockImplementation(async (_rp, address) =>
      onChain({ initialized: address !== staging }),
    );
    expect(await setup()).toMatchObject({ ok: true });
    const op = send.mock.calls[1][0];
    const safe = new Interface(SAFE_ABI).decodeFunctionData(
      "executeUserOp",
      op.callData,
    );
    expect(
      new Interface(RP_ABI).parseTransaction({ data: safe[2] })?.name,
    ).toBe("register");
  });

  it("preserves production progress when staging preparation fails; manual staging retry sends only staging", async () => {
    readRp.mockImplementation(async (_rp, address) => {
      if (address === staging) throw new Error("staging unavailable");
      return onChain();
    });
    expect(await setup()).toMatchObject({
      ok: true,
      status: "pending",
      stagingStatus: "failed",
    });
    expect(send).toHaveBeenCalledTimes(1);
    dbRecord = makeDbRecord({ status: "registered", staging_status: "failed" });
    backfill.production_status = "already_registered";
    readRp.mockResolvedValue(onChain());
    send.mockClear();
    const res = await retry(
      makeRequest("retry_rp", { rp_id: rpId, environment: "staging" }),
    );
    expect(res?.status).toBe(200);
    expect(send).toHaveBeenCalledTimes(1);
    const safe = new Interface(SAFE_ABI).decodeFunctionData(
      "executeUserOp",
      send.mock.calls[0][0].callData,
    );
    expect(safe[0].toLowerCase()).toBe(staging);
  });

  it("allows an existing Portal registration to start its never-attempted staging setup", async () => {
    backfill.production_status = "already_registered";
    backfill.staging_status = "unused";
    dbRecord = makeDbRecord({
      status: "registered",
      staging_status: null,
      staging_operation_hash: null,
    });
    readRp.mockResolvedValue(onChain({ initialized: false }));
    const res = await retry(
      makeRequest("retry_rp", { rp_id: rpId, environment: "staging" }),
    );
    expect(await res?.json()).toMatchObject({
      success: true,
      environment: "staging",
    });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("keeps both a lost response and an old pending activation pending, and rejects retry", async () => {
    send.mockRejectedValueOnce(new Error("lost response"));
    const result = await setup();
    expect(result).toMatchObject({ ok: true, status: "pending" });
    expect(attemptWrites.every((write) => write.status === "pending")).toBe(
      true,
    );
    const res = await status(new NextRequest("http://localhost/status"), {
      params: Promise.resolve({ rp_id: rpId }),
    });
    expect(await res.json()).toEqual({
      production_status: "pending",
      staging_status: "pending",
    });
    send.mockClear();
    const retried = await retry(
      makeRequest("retry_rp", { rp_id: rpId, environment: "production" }),
    );
    expect(await retried?.json()).toMatchObject({
      extensions: { code: "activation_pending" },
    });
    expect(send).not.toHaveBeenCalled();
    expect(
      request.mock.calls.some((call) =>
        queryText(call[0]).includes("DeleteRpRegistration"),
      ),
    ).toBe(false);
  });

  it("marks only a confirmed failed activation retryable, and finalizes a trusted other registry", async () => {
    readRp.mockImplementation(async (_rp, address) =>
      onChain({ signer: address === staging ? signer : RP_RESERVATION_SIGNER }),
    );
    receipt.mockImplementation(async (hash) => ({
      userOpHash: hash,
      success: false,
    }));
    const res = await status(new NextRequest("http://localhost/status"), {
      params: Promise.resolve({ rp_id: rpId }),
    });
    expect(await res.json()).toEqual({
      production_status: "failed",
      staging_status: "registered",
    });
    expect(
      request.mock.calls.filter((call) =>
        queryText(call[0]).includes("mutation FinalizeRpBackfill"),
      ),
    ).toHaveLength(1);
    expect(attemptWrites.map((write) => write.status)).toEqual([
      "failed",
      "registered",
    ]);
  });

  it("keeps status reads working while setup is paused without taking the backfill write lock", async () => {
    process.env.RP_SETUP_PAUSED = "true";
    readRp.mockResolvedValue(onChain({ signer }));
    const res = await status(new NextRequest("http://localhost/status"), {
      params: Promise.resolve({ rp_id: rpId }),
    });
    expect(await res.json()).toEqual({
      production_status: "registered",
      staging_status: "registered",
    });
    expect(
      request.mock.calls.some((call) =>
        queryText(call[0]).includes("mutation FinalizeRpBackfill"),
      ),
    ).toBe(false);
  });

  it("leaves status pending after a failed registry or receipt read", async () => {
    readRp.mockRejectedValue(new Error("RPC unavailable"));
    receipt.mockRejectedValue(new Error("receipt unavailable"));
    const res = await status(new NextRequest("http://localhost/status"), {
      params: Promise.resolve({ rp_id: rpId }),
    });
    expect(await res.json()).toEqual({
      production_status: "pending",
      staging_status: "pending",
    });
    expect(attemptWrites).toHaveLength(0);
  });

  it("does not resubmit a reservation already carrying the requested real signer", async () => {
    readRp.mockResolvedValue(onChain({ signer }));
    expect(await setup()).toMatchObject({
      ok: true,
      status: "registered",
      stagingStatus: "registered",
    });
    expect(send).not.toHaveBeenCalled();
  });

  it.each([{ manager: signer }, { signer: manager }])(
    "refuses reservation ownership mismatch %s",
    async (mismatch) => {
      readRp.mockResolvedValue(onChain(mismatch));
      expect(await setup()).toMatchObject({
        ok: true,
        status: "failed",
        stagingStatus: "failed",
      });
      expect(send).not.toHaveBeenCalled();
    },
  );

  it.each(["database error", "deleted app"])(
    "stops all submissions if saving the request fails: %s",
    async (failure) => {
      request.mockImplementation(async (query, variables) => {
        if (queryText(query).includes("mutation SaveRpActivation")) {
          if (failure === "database error") throw new Error("DB unavailable");
          return { update_rp_registration: { affected_rows: 0 } };
        }
        return graphql(query, variables);
      });
      expect(await setup()).toMatchObject({ ok: false, code: "db_error" });
      expect(send).not.toHaveBeenCalled();
      expect(readRp).toHaveBeenCalledTimes(1);
    },
  );
});
// #endregion

// #region Setup authorization and guards
describe("setup guards", () => {
  it("blocks managed setup, direct self-managed setup, and retries while paused", async () => {
    process.env.RP_SETUP_PAUSED = "true";
    expect(await setup()).toMatchObject({ ok: false, code: "setup_paused" });
    for (const mode of ["managed", "self_managed"]) {
      const res = await register(
        makeRequest("register_rp", {
          app_id: appId,
          mode,
          signer_address: signer,
        }),
      );
      expect(await res?.json()).toMatchObject({
        extensions: { code: "setup_paused" },
      });
    }
    const res = await retry(
      makeRequest("retry_rp", { rp_id: rpId, environment: "production" }),
    );
    expect(await res?.json()).toMatchObject({
      extensions: { code: "setup_paused" },
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("blocks both environments while either reservation is unresolved and prevents self-managed reservation bypass", async () => {
    backfill.staging_status = "in_progress";
    backfill.staging_request_id = "0xuncertain";
    expect(await setup()).toMatchObject({
      ok: false,
      code: "reservation_pending",
    });
    const res = await retry(
      makeRequest("retry_rp", { rp_id: rpId, environment: "production" }),
    );
    expect(await res?.json()).toMatchObject({
      extensions: { code: "reservation_pending" },
    });
    backfill.staging_status = "reserved";
    backfill.staging_request_id = null;
    const direct = await register(
      makeRequest("register_rp", { app_id: appId, mode: "self_managed" }),
    );
    expect(await direct?.json()).toMatchObject({
      extensions: { code: "reservation_pending" },
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("requires the caller's normal app permissions", async () => {
    permitted = false;
    const res = await register(
      makeRequest("register_rp", {
        app_id: appId,
        mode: "managed",
        signer_address: signer,
      }),
    );
    expect(await res?.json()).toMatchObject({
      extensions: { code: "unauthorized" },
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects deleted-app activation and retry; a restored app can activate", async () => {
    appDeleted = true;
    dbRecord.app.deleted_at = "2026-01-01" as never;
    const res = await register(
      makeRequest("register_rp", {
        app_id: appId,
        mode: "managed",
        signer_address: signer,
      }),
    );
    expect(await res?.json()).toMatchObject({
      extensions: { code: "app_not_found" },
    });
    const retried = await retry(
      makeRequest("retry_rp", { rp_id: rpId, environment: "production" }),
    );
    expect(await retried?.json()).toMatchObject({
      extensions: { code: "not_found" },
    });
    expect(send).not.toHaveBeenCalled();
    appDeleted = false;
    dbRecord.app.deleted_at = null;
    const restored = await register(
      makeRequest("register_rp", {
        app_id: appId,
        mode: "managed",
        signer_address: signer,
      }),
    );
    expect(restored?.status).toBe(200);
    expect(send).toHaveBeenCalledTimes(2);
  });
});
// #endregion

// #region MCP uses the real shared activation/status helpers
describe("MCP reservation setup", () => {
  it("returns the generated key even when an activation submission response is lost", async () => {
    send.mockRejectedValue(new Error("lost response"));
    const body = await (await callMcp("configure_world_id")).json();
    const payload = JSON.parse(body.result.content[0].text);
    expect(payload).toMatchObject({
      rp_id: rpId,
      status: "pending",
      staging_status: "pending",
    });
    expect(payload.signing_key.private_key).toBeTruthy();
    expect(
      attemptWrites.every((write) => write.status === "pending" && write.hash),
    ).toBe(true);
  });

  it("keeps an old pending activation pending in the MCP status path", async () => {
    mcpRegistration = dbRecord;
    const body = await (
      await callMcp("get_world_id_registration_status")
    ).json();
    expect(JSON.parse(body.result.content[0].text)).toMatchObject({
      production_status: "pending",
      staging_status: "pending",
    });
    expect(attemptWrites).toHaveLength(0);
  });

  it("enforces the pause and rejects deleted apps before submitting", async () => {
    process.env.RP_SETUP_PAUSED = "true";
    expect(await (await callMcp("configure_world_id")).json()).toMatchObject({
      error: { data: { reason: "setup_paused" } },
    });
    process.env.RP_SETUP_PAUSED = "false";
    appDeleted = true;
    expect(await (await callMcp("configure_world_id")).json()).toMatchObject({
      error: { code: -32004 },
    });
    expect(send).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Partial activation cannot be bypassed by maintenance endpoints
describe("maintenance during partial activation", () => {
  it.each(["reserved", "unused"])(
    "preserves uncertain staging activation (%s) across rotate, toggle and mode switch",
    async (stagingState) => {
      backfill.production_status = "already_registered";
      backfill.staging_status = stagingState;
      dbRecord = makeDbRecord({
        status: "registered",
        staging_status: "pending",
      });
      const rotated = await submitManagedSignerRotation({
        client,
        appId,
        newSignerAddress: manager,
      });
      expect(rotated).toMatchObject({
        ok: false,
        code: "rotation_in_progress",
      });
      for (const [handler, action] of [
        [switchMode, "switch_to_self_managed"],
        [toggle, "toggle_rp_active"],
      ] as const) {
        const res = await handler(
          makeRequest(action, {
            app_id: appId,
            ...(action === "switch_to_self_managed"
              ? { new_manager_address: manager }
              : {}),
          }),
        );
        expect(await res?.json()).toMatchObject({
          extensions: { code: "operation_in_progress" },
        });
      }
      expect(send).not.toHaveBeenCalled();
      expect(dbRecord.staging_operation_hash).toBe("0xstaging");
    },
  );
});
// #endregion
