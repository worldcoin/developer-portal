import { POST } from "@/api/hasura/rp-retry";
import { generateRpIdString } from "@/lib/rp";
import { RP_BACKFILL_PLACEHOLDER_SIGNER } from "@/lib/rp-id-backfill";
import { NextRequest } from "next/server";

// #region Mocks
const GetRpRegistrationForRetry = jest.fn();
const CheckUserInApp = jest.fn();
const GetRpBackfill = jest.fn();
const ClaimProductionBackfillRetry = jest.fn();
const ClaimStagingBackfillRetry = jest.fn();
const FinalizeProductionBackfill = jest.fn();
const FinalizeStagingBackfill = jest.fn();
const UpdateProductionRetry = jest.fn();
const UpdateStagingRetry = jest.fn();
const read = jest.fn();
const register = jest.fn();
const rotate = jest.fn();
jest.mock(
  "@/api/hasura/rp-retry/graphql/get-rp-registration.generated",
  () => ({ getSdk: () => ({ GetRpRegistrationForRetry }) }),
);
jest.mock("@/api/hasura/graphql/checkUserInApp.generated", () => ({
  getSdk: () => ({ CheckUserInApp }),
}));
jest.mock("@/api/helpers/graphql/rp-id-backfill.generated", () => ({
  getSdk: () => ({
    GetRpBackfill,
    FinalizeProductionBackfill,
    FinalizeStagingBackfill,
    ClaimProductionBackfillRetry,
    ClaimStagingBackfillRetry,
  }),
}));
jest.mock(
  "@/api/hasura/rp-retry/graphql/update-production-retry.generated",
  () => ({ getSdk: () => ({ UpdateProductionRetry }) }),
);
jest.mock(
  "@/api/hasura/rp-retry/graphql/update-staging-retry.generated",
  () => ({ getSdk: () => ({ UpdateStagingRetry }) }),
);
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));
jest.mock("@/api/helpers/kms", () => ({
  getKMSClient: jest.fn().mockResolvedValue({}),
}));
jest.mock("@/api/helpers/kms-eth", () => ({
  getEthAddressFromKMS: jest.fn(async () => manager),
}));
jest.mock("@/api/helpers/temporal-rpc", () => ({
  getRpFromContract: (...args: unknown[]) => read(...args),
}));
jest.mock("@/api/helpers/rp-transactions", () => ({
  submitRegisterRpTransaction: (...args: unknown[]) => register(...args),
  submitRotateSignerTransaction: (...args: unknown[]) => rotate(...args),
}));
jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test Data
const appId = `app_${"12".repeat(16)}`;
const rpId = generateRpIdString(appId);
const manager = `0x${"22".repeat(20)}`;
const signer = `0x${"33".repeat(20)}`;
const makeDbRecord = (overrides = {}) => ({
  app_id: appId,
  rp_id: rpId,
  mode: "managed",
  status: "failed",
  staging_status: "failed",
  manager_kms_key_id: "shared-key",
  signer_address: signer,
  updated_at: "2020-01-01T00:00:00Z",
  app: { id: appId, team_id: "team_fixture", app_metadata: [{ name: "App" }] },
  ...overrides,
});
const makeBackfill = (overrides = {}) => ({
  app_id: appId,
  rp_id: rpId,
  production_status: "reserved",
  production_request_id: null,
  staging_status: "reserved",
  staging_request_id: null,
  ...overrides,
});
const request = (environment = "production") =>
  new NextRequest("http://localhost/api/hasura/rp-retry", {
    method: "POST",
    headers: {
      authorization: "Bearer internal-test",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: { name: "retry_rp" },
      session_variables: { "x-hasura-user-id": "usr_fixture" },
      input: { rp_id: rpId, environment },
    }),
  });
// #endregion

beforeEach(async () => {
  jest.resetAllMocks();
  await global.RedisClient?.flushall();
  delete process.env.RP_ID_BACKFILL_SETUP_PAUSED;
  Object.assign(process.env, {
    INTERNAL_ENDPOINTS_SECRET: "internal-test",
    RP_REGISTRY_SAFE_OWNER_KMS_KEY_ID: "safe-key",
    RP_REGISTRY_MANAGER_KMS_KEY_ID: "shared-key",
    RP_REGISTRY_CONTRACT_ADDRESS: `0x${"44".repeat(20)}`,
    RP_REGISTRY_STAGING_CONTRACT_ADDRESS: `0x${"55".repeat(20)}`,
    RP_REGISTRY_SAFE_ADDRESS: `0x${"66".repeat(20)}`,
    RP_REGISTRY_ENTRYPOINT_ADDRESS: `0x${"77".repeat(20)}`,
    RP_REGISTRY_SAFE_4337_MODULE_ADDRESS: `0x${"88".repeat(20)}`,
    RP_REGISTRY_KMS_REGION: "eu-west-1",
    RP_REGISTRY_DOMAIN_SEPARATOR: `0x${"99".repeat(32)}`,
    RP_REGISTRY_UPDATE_RP_TYPEHASH: `0x${"aa".repeat(32)}`,
    RP_REGISTRY_STAGING_DOMAIN_SEPARATOR: `0x${"bb".repeat(32)}`,
    RP_REGISTRY_STAGING_UPDATE_RP_TYPEHASH: `0x${"cc".repeat(32)}`,
    CREDENTIAL_SCHEMA_ISSUER_REGISTRY_ADDRESS: `0x${"dd".repeat(20)}`,
  });
  // resetAllMocks also clears these I/O implementations.
  jest
    .requireMock("@/api/helpers/graphql")
    .getAPIServiceGraphqlClient.mockResolvedValue({});
  jest.requireMock("@/api/helpers/kms").getKMSClient.mockResolvedValue({});
  jest
    .requireMock("@/api/helpers/kms-eth")
    .getEthAddressFromKMS.mockResolvedValue(manager);
  GetRpRegistrationForRetry.mockResolvedValue({
    rp_registration_by_pk: makeDbRecord(),
  });
  CheckUserInApp.mockResolvedValue({ team: [{ id: "team_fixture" }] });
  GetRpBackfill.mockResolvedValue({ rp_id_backfill_by_pk: null });
  ClaimProductionBackfillRetry.mockResolvedValue({
    update_rp_registration: { affected_rows: 1 },
  });
  ClaimStagingBackfillRetry.mockResolvedValue({
    update_rp_registration: { affected_rows: 1 },
  });
  read.mockResolvedValue({
    initialized: true,
    active: true,
    manager,
    signer: RP_BACKFILL_PLACEHOLDER_SIGNER,
  });
  register.mockResolvedValue("0xregister");
  rotate.mockResolvedValue("0xrotate");
});

// #region Reservation-aware retry branches
describe("retry_rp backfill compatibility", () => {
  it.each(["production", "staging"])(
    "pauses first registration in %s",
    async (registry) => {
      process.env.RP_ID_BACKFILL_SETUP_PAUSED = "true";
      read.mockResolvedValue({ initialized: false });
      const response = await POST(request(registry));
      expect((await response!.json()).extensions.code).toBe("setup_paused");
      expect(register).not.toHaveBeenCalled();
    },
  );

  it("permits maintenance of an initialized ordinary RP during the pause", async () => {
    process.env.RP_ID_BACKFILL_SETUP_PAUSED = "true";
    const response = await POST(request());
    expect(response!.status).toBe(200);
    expect(rotate).toHaveBeenCalledTimes(1);
  });

  it("does not resubmit an activation still within its validity window", async () => {
    GetRpBackfill.mockResolvedValue({ rp_id_backfill_by_pk: makeBackfill() });
    GetRpRegistrationForRetry.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        updated_at: new Date().toISOString(),
        status: "pending",
      }),
    });
    const response = await POST(request());
    expect((await response!.json()).extensions.code).toBe(
      "operation_in_progress",
    );
    expect(rotate).not.toHaveBeenCalled();
  });

  it("retries an expired staging activation as a signer update", async () => {
    GetRpBackfill.mockResolvedValue({
      rp_id_backfill_by_pk: makeBackfill({
        production_status: "already_registered",
      }),
    });
    const response = await POST(request("staging"));
    expect(response!.status).toBe(200);
    expect(register).not.toHaveBeenCalled();
    expect(rotate).toHaveBeenCalledTimes(1);
    expect(UpdateStagingRetry).toHaveBeenCalledWith({
      rp_id: rpId,
      staging_operation_hash: "0xrotate",
      staging_status: "pending",
    });
    expect(UpdateProductionRetry).not.toHaveBeenCalled();
    expect(ClaimStagingBackfillRetry.mock.invocationCallOrder[0]).toBeLessThan(
      rotate.mock.invocationCallOrder[0],
    );
  });

  it("finalizes an already-applied activation without another transaction", async () => {
    GetRpBackfill.mockResolvedValue({ rp_id_backfill_by_pk: makeBackfill() });
    read.mockResolvedValue({
      initialized: true,
      active: true,
      manager,
      signer,
    });
    const response = await POST(request());
    expect(response!.status).toBe(200);
    expect(FinalizeProductionBackfill).toHaveBeenCalledWith({
      app_id: appId,
      rp_id: rpId,
    });
    expect(rotate).not.toHaveBeenCalled();
  });

  it("does not retry an unresolved backfill request", async () => {
    GetRpBackfill.mockResolvedValue({
      rp_id_backfill_by_pk: makeBackfill({
        production_status: "in_progress",
        production_request_id: `0x${"ef".repeat(32)}`,
      }),
    });
    const response = await POST(request());
    expect((await response!.json()).extensions.code).toBe(
      "reservation_in_progress",
    );
    expect(read).not.toHaveBeenCalled();
  });

  it("does not bypass a foreign manager for a tracked reservation", async () => {
    GetRpBackfill.mockResolvedValue({ rp_id_backfill_by_pk: makeBackfill() });
    read.mockResolvedValue({
      initialized: true,
      manager: `0x${"ff".repeat(20)}`,
      signer,
    });
    const response = await POST(request());
    expect((await response!.json()).extensions.code).toBe("rp_id_taken");
    expect(rotate).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Retry attempt persistence
describe("reservation retry attempt persistence", () => {
  it("retains a fresh pending attempt after a lost retry response", async () => {
    GetRpBackfill.mockResolvedValue({ rp_id_backfill_by_pk: makeBackfill() });
    rotate.mockRejectedValueOnce(new Error("response lost"));
    const response = await POST(request());
    expect((await response!.json()).extensions.code).toBe("submission_error");
    expect(ClaimProductionBackfillRetry).toHaveBeenCalledTimes(1);
    expect(
      ClaimProductionBackfillRetry.mock.invocationCallOrder[0],
    ).toBeLessThan(rotate.mock.invocationCallOrder[0]);
    expect(UpdateProductionRetry).not.toHaveBeenCalled();
  });
  it("does not submit after losing a concurrent retry claim", async () => {
    GetRpBackfill.mockResolvedValue({ rp_id_backfill_by_pk: makeBackfill() });
    ClaimProductionBackfillRetry.mockResolvedValue({
      update_rp_registration: { affected_rows: 0 },
    });
    const response = await POST(request());
    expect((await response!.json()).extensions.code).toBe(
      "operation_in_progress",
    );
    expect(rotate).not.toHaveBeenCalled();
  });
});
// #endregion
