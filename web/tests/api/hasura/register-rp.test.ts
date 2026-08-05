import { POST } from "@/api/hasura/register-rp";
import { NextRequest } from "next/server";

// #region Mocks
const requestMock = jest.fn();
const submitManagedRpRegistrationMock = jest.fn();

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn(async () => ({ request: requestMock })),
}));

jest.mock("@/api/helpers/rp-registration-flows", () => ({
  submitManagedRpRegistration: (...args: unknown[]) =>
    submitManagedRpRegistrationMock(...args),
}));

const getRpFromContractMock = jest.fn();
jest.mock("@/api/helpers/temporal-rpc", () => ({
  getRpFromContract: (...args: unknown[]) => getRpFromContractMock(...args),
}));

const resolveManagerAddressMock = jest.fn();
jest.mock("@/api/helpers/rp-manager", () => ({
  resolveManagerAddress: (...args: unknown[]) =>
    resolveManagerAddressMock(...args),
}));

const getRpRegistryConfigMock = jest.fn();
jest.mock("@/api/helpers/rp-utils", () => {
  const actual = jest.requireActual("@/api/helpers/rp-utils");
  return {
    ...actual,
    getRpRegistryConfig: () => getRpRegistryConfigMock(),
  };
});

jest.mock("@/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));
// #endregion

// #region Test Data
const appId = "app_9cdd0a714aec9ed17dca660bc9ffe72a";
const teamId = "team_dd2ecd36c6c45f645e8e5d9a31abdee1";
const userId = "user_123";
const signerAddress = "0x1111111111111111111111111111111111111111";

// Per-test knobs the default GraphQL mock reads. `beforeEach` resets them to a
// non-staging app owned by an authorized user (the happy path).
let appIsStaging = false;
let authorizedTeam: Array<{ id: string }> = [{ id: teamId }];

const getOperationName = (query: unknown) => {
  if (typeof query === "string") {
    return query;
  }

  return (
    (query as { definitions?: { name?: { value?: string } }[] })
      .definitions?.[0]?.name?.value ?? ""
  );
};

const createMockRequest = (input: Record<string, unknown>) =>
  new NextRequest("http://localhost:3000/api/hasura/register-rp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`,
    },
    body: JSON.stringify({
      action: { name: "register_rp" },
      session_variables: {
        "x-hasura-user-id": userId,
      },
      input,
    }),
  });
// #endregion

const portalManagerAddress = "0x2222222222222222222222222222222222222222";
const placeholderSigner = "0x000000000000000000000000000000000000dEaD";

beforeEach(() => {
  jest.clearAllMocks();
  process.env.INTERNAL_ENDPOINTS_SECRET = "internal-secret";
  process.env.RP_REGISTRY_MANAGER_KMS_KEY_ID =
    "arn:aws:kms:eu-west-1:000000000000:key/shared-manager";
  process.env.RP_ID_PRE_REGISTRATION_SIGNER = placeholderSigner;
  delete process.env.ENABLE_RP_ID_PRE_REGISTRATION;
  appIsStaging = false;
  authorizedTeam = [{ id: teamId }];

  getRpRegistryConfigMock.mockReturnValue({
    contractAddress: "0xcontract",
    kmsRegion: "eu-west-1",
  });
  resolveManagerAddressMock.mockResolvedValue(portalManagerAddress);
  // Default: the self-managed developer has already run register() themselves,
  // which is the state this mutation is reached in.
  getRpFromContractMock.mockResolvedValue({
    initialized: true,
    active: true,
    manager: "0xDeveloperOwnedManager",
    signer: "0xDeveloperOwnedSigner",
  });

  submitManagedRpRegistrationMock.mockResolvedValue({
    ok: true,
    rpIdString: "rp_abc123",
    managerAddress: "0x2222222222222222222222222222222222222222",
    signerAddress,
    operationHash: "0xophash",
    status: "pending",
    stagingOperationHash: null,
    stagingStatus: null,
  });

  requestMock.mockImplementation(async (query: unknown) => {
    const operationName = getOperationName(query);

    if (operationName.includes("GetAppInfo")) {
      return {
        app: [
          {
            id: appId,
            team_id: teamId,
            is_staging: appIsStaging,
            app_metadata: [{ name: "Test App" }],
          },
        ],
      };
    }

    if (operationName.includes("CheckUserInApp")) {
      return { team: authorizedTeam };
    }

    if (operationName.includes("ClaimRpRegistration")) {
      return { insert_rp_registration_one: { rp_id: "rp_abc123" } };
    }

    throw new Error(`Unexpected query: ${operationName}`);
  });
});

// #region Successful registration (no rollout feature flag)
describe("/api/hasura/register-rp [success]", () => {
  it("registers a managed RP without requiring a rollout feature flag", async () => {
    const res = (await POST(
      createMockRequest({
        app_id: appId,
        mode: "managed",
        signer_address: signerAddress,
      }),
    ))!;

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.rp_id).toBe("rp_abc123");
    // The managed pipeline runs; it is no longer short-circuited by a
    // `feature_not_enabled` rollout gate, and the helper is invoked without a
    // teamId argument.
    expect(submitManagedRpRegistrationMock).toHaveBeenCalledTimes(1);
    const callArg = submitManagedRpRegistrationMock.mock.calls[0][0];
    expect(callArg).toMatchObject({
      appId,
      signerAddress,
      isStaging: false,
    });
    expect(callArg).not.toHaveProperty("teamId");
  });

  it("creates a self-managed registration without requiring a rollout feature flag", async () => {
    const res = (await POST(
      createMockRequest({
        app_id: appId,
        mode: "self_managed",
        signer_address: null,
      }),
    ))!;

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.rp_id).toEqual(expect.any(String));
    expect(body.status).toBe("pending");
    // Self-managed skips the managed pipeline entirely.
    expect(submitManagedRpRegistrationMock).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Self-managed vs a defensively claimed rp_id
describe("/api/hasura/register-rp [self-managed on-chain ownership]", () => {
  const selfManaged = () =>
    POST(createMockRequest({ app_id: appId, mode: "self_managed" }));

  it("succeeds when the developer has already registered the id themselves", async () => {
    // This mutation is the "Continue" AFTER the instructions screen, so the id
    // being initialized on-chain is the healthy state. Treating any initialized
    // id as a conflict would break every legitimate self-managed completion.
    const res = (await selfManaged())!;

    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("pending");
  });

  it("refuses when the id carries the Portal's pre-claim placeholder signer", async () => {
    // Defensively pre-claimed: the developer's register() reverted against it,
    // and handing the id over needs a manager transfer that no flow drives yet.
    getRpFromContractMock.mockResolvedValue({
      initialized: true,
      active: true,
      manager: portalManagerAddress,
      signer: placeholderSigner,
    });

    const res = (await selfManaged())!;
    const body = await res.json();

    expect(body.code ?? body.extensions?.code).toBe("rp_id_taken");
  });

  it("does not depend on KMS to recognise a pre-claim", async () => {
    // The check compares the placeholder signer, an env var we control, rather
    // than resolving our manager key. A KMS outage must not decide between
    // blocking every legitimate self-managed completion and silently admitting a
    // pre-claimed id that rp-status would then promote against a dead signer.
    resolveManagerAddressMock.mockResolvedValue(null);
    getRpFromContractMock.mockResolvedValue({
      initialized: true,
      active: true,
      manager: portalManagerAddress,
      signer: placeholderSigner,
    });

    const res = (await selfManaged())!;
    const body = await res.json();

    expect(body.code ?? body.extensions?.code).toBe("rp_id_taken");
    expect(resolveManagerAddressMock).not.toHaveBeenCalled();
  });

  it("returns a retryable error when the chain cannot be read and pre-claims are possible", async () => {
    // Admitting a pre-claimed id here creates a row that rp-status promotes (it
    // trusts self-managed rows by mode) against a signer that can never sign.
    // A retryable error is recoverable; that registration is not.
    getRpFromContractMock.mockRejectedValue(new Error("rpc timeout"));

    const res = (await selfManaged())!;
    const body = await res.json();

    expect(body.code ?? body.extensions?.code).toBe("rpc_error");
  });

  it("skips the check entirely where pre-claims cannot exist", async () => {
    // Neither tell available and pre-registration never enabled: there is nothing
    // to recognise, so a read failure must not block onboarding. This is every
    // environment that has not run the tool.
    delete process.env.RP_ID_PRE_REGISTRATION_SIGNER;
    delete process.env.RP_REGISTRY_MANAGER_KMS_KEY_ID;
    delete process.env.ENABLE_RP_ID_PRE_REGISTRATION;
    getRpFromContractMock.mockRejectedValue(new Error("rpc timeout"));

    const res = (await selfManaged())!;

    expect(res.status).toBe(200);
    expect(getRpFromContractMock).not.toHaveBeenCalled();
  });

  it("refuses to proceed when pre-registration is on and nothing identifies a claim", async () => {
    // Claims are being made and neither tell is available — a deploy fault, not
    // something a developer should absorb as a broken registration.
    process.env.ENABLE_RP_ID_PRE_REGISTRATION = "true";
    process.env.RP_ID_PRE_REGISTRATION_SIGNER = `0x${"0".repeat(40)}`;
    delete process.env.RP_REGISTRY_MANAGER_KMS_KEY_ID;

    const res = (await selfManaged())!;
    const body = await res.json();

    expect(body.code ?? body.extensions?.code).toBe("config_error");
  });

  it("falls back to the shared manager when the placeholder signer is unset", async () => {
    // Defensive claims outlive the kill switch, so the guard cannot be keyed to it:
    // sweep has run, flag turned back off, placeholder unset. Without the manager
    // fallback a Portal-held placeholder RP would be inserted as self_managed and
    // rp-status would promote it against a signer that can never sign.
    delete process.env.RP_ID_PRE_REGISTRATION_SIGNER;
    delete process.env.ENABLE_RP_ID_PRE_REGISTRATION;
    getRpFromContractMock.mockResolvedValue({
      initialized: true,
      active: true,
      manager: portalManagerAddress,
      signer: "0xSomeOtherSigner",
    });

    const res = (await selfManaged())!;
    const body = await res.json();

    expect(body.code ?? body.extensions?.code).toBe("rp_id_taken");
    expect(resolveManagerAddressMock).toHaveBeenCalled();
  });

  it("returns a retryable error when the manager fallback cannot resolve", async () => {
    delete process.env.RP_ID_PRE_REGISTRATION_SIGNER;
    resolveManagerAddressMock.mockResolvedValue(null);
    getRpFromContractMock.mockResolvedValue({
      initialized: true,
      active: true,
      manager: portalManagerAddress,
      signer: "0xSomeOtherSigner",
    });

    const res = (await selfManaged())!;
    const body = await res.json();

    expect(body.code ?? body.extensions?.code).toBe("kms_error");
  });
});
// #endregion

// #region Staging app migration (product guard — kept)
describe("/api/hasura/register-rp [staging app migration]", () => {
  it("rejects managed RP registration for staging apps", async () => {
    appIsStaging = true;
    const res = (await POST(
      createMockRequest({
        app_id: appId,
        mode: "managed",
        signer_address: signerAddress,
      }),
    ))!;

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.extensions.code).toBe("staging_not_supported");
    expect(body.message).toBe(
      "Staging apps cannot be migrated to World ID 4.0.",
    );
    expect(submitManagedRpRegistrationMock).not.toHaveBeenCalled();
  });

  it("rejects self-managed RP registration for staging apps", async () => {
    appIsStaging = true;
    const res = (await POST(
      createMockRequest({
        app_id: appId,
        mode: "self_managed",
        signer_address: null,
      }),
    ))!;

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.extensions.code).toBe("staging_not_supported");
    expect(submitManagedRpRegistrationMock).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Signer validation
describe("/api/hasura/register-rp [signer validation]", () => {
  it("rejects the zero address as a managed signer", async () => {
    // `isAddress` accepts it, but an RP whose signer is the zero address can
    // never sign a proof request.
    const res = (await POST(
      createMockRequest({
        app_id: appId,
        mode: "managed",
        signer_address: `0x${"0".repeat(40)}`,
      }),
    ))!;

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.extensions.code).toBe("invalid_request");
    expect(submitManagedRpRegistrationMock).not.toHaveBeenCalled();
  });

  it("surfaces an rp_id_taken conflict from the managed pipeline", async () => {
    submitManagedRpRegistrationMock.mockResolvedValueOnce({
      ok: false,
      code: "rp_id_taken",
      detail:
        "This app's RP ID is already registered on-chain by another party. Portal cannot manage it — contact support.",
    });

    const res = (await POST(
      createMockRequest({
        app_id: appId,
        mode: "managed",
        signer_address: signerAddress,
      }),
    ))!;

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.extensions.code).toBe("rp_id_taken");
  });
});
// #endregion

// #region Authorization (product guard — kept)
describe("/api/hasura/register-rp [authorization]", () => {
  it("rejects registration when the user lacks ADMIN/OWNER on the team", async () => {
    authorizedTeam = [];
    const res = (await POST(
      createMockRequest({
        app_id: appId,
        mode: "managed",
        signer_address: signerAddress,
      }),
    ))!;

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.extensions.code).toBe("unauthorized");
    expect(submitManagedRpRegistrationMock).not.toHaveBeenCalled();
  });
});
// #endregion
