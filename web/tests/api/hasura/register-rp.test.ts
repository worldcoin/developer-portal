import { POST } from "@/api/hasura/register-rp";
import { isWorldId40EnabledServer } from "@/lib/feature-flags/world-id-4-0/server";
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

jest.mock("@/lib/feature-flags/world-id-4-0/server", () => ({
  isWorldId40EnabledServer: jest.fn(),
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
const appId = "app_staging_9cdd0a714aec9ed17dca660bc9ffe72a";
const teamId = "team_dd2ecd36c6c45f645e8e5d9a31abdee1";
const userId = "user_123";
const signerAddress = "0x1111111111111111111111111111111111111111";

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
  (isWorldId40EnabledServer as jest.Mock).mockResolvedValue(true);

  requestMock.mockImplementation(async (query: unknown) => {
    const operationName = getOperationName(query);

    if (operationName.includes("GetAppInfo")) {
      return {
        app: [
          {
            id: appId,
            team_id: teamId,
            is_staging: true,
            app_metadata: [{ name: "Staging App" }],
          },
        ],
      };
    }

    if (operationName.includes("CheckUserInApp")) {
      return { team: [{ id: teamId }] };
    }

    throw new Error(`Unexpected query: ${operationName}`);
  });
});

// #region Staging app migration
describe("/api/hasura/register-rp [staging app migration]", () => {
  it("rejects managed RP registration for staging apps", async () => {
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
