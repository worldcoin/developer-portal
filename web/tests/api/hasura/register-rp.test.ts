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

beforeEach(() => {
  jest.clearAllMocks();
  process.env.INTERNAL_ENDPOINTS_SECRET = "internal-secret";
  appIsStaging = false;
  authorizedTeam = [{ id: teamId }];

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
