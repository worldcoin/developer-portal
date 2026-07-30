import {
  getAPIServiceGraphqlClient,
  getSessionAnalyticsGraphqlClient,
} from "@/api/helpers/graphql";
import { handleSessionProofVerification } from "@/api/v4/verify/session-proof/handler";
import { processSessionProof } from "@/api/v4/verify/session-proof/verify-util";
import { logger } from "@/lib/logger";
import { print } from "graphql";
import { captureEvent } from "../../../services/posthogClient";

// #region Mocks
const mockGraphqlRequest = jest.fn();

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
  getSessionAnalyticsGraphqlClient: jest.fn().mockResolvedValue({
    request: (...args: unknown[]) => mockGraphqlRequest(...args),
  }),
}));

jest.mock("@/api/helpers/rp-utils", () => ({
  parseRpId: jest.fn().mockReturnValue(123n),
}));

jest.mock("@/api/v4/verify/session-proof/verify-util", () => ({
  processSessionProof: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("../../../services/posthogClient", () => ({
  captureEvent: jest.fn().mockResolvedValue(undefined),
}));
// #endregion

// #region Test Data
const rpId = "rp_0123456789abcdef";
const appId = "app_0123456789abcdef0123456789abcdef";
const success = {
  identifier: "face",
  sessionId: "session-analytics-test",
  success: true,
  nullifier: "1",
};
const failure = {
  identifier: "device",
  sessionId: "session-analytics-test",
  success: false,
  code: "invalid_proof",
  detail: "Proof verification failed.",
};
const baseParams: Parameters<typeof handleSessionProofVerification>[2] = {
  session_id: "session-analytics-test",
  nonce: "1",
  protocol_version: "4.0",
  responses: [
    {
      identifier: "face",
      signal_hash: "0x0",
      issuer_schema_id: "1",
      session_nullifier: ["1", "2"],
      expires_at_min: "1800000000",
      proof: ["1", "2", "3", "4", "5"],
    },
  ],
};

const verify = (
  overrides: Partial<Parameters<typeof handleSessionProofVerification>[2]> = {},
) =>
  handleSessionProofVerification(rpId, appId, {
    ...baseParams,
    ...overrides,
    responses: overrides.responses ?? [...baseParams.responses],
  });
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  process.env.VERIFIER_CONTRACT_ADDRESS = "0xproduction";
  process.env.VERIFIER_CONTRACT_ADDRESS_STAGING = "0xstaging";
  (captureEvent as jest.Mock).mockResolvedValue(undefined);
  (getSessionAnalyticsGraphqlClient as jest.Mock).mockResolvedValue({
    request: (...args: unknown[]) => mockGraphqlRequest(...args),
  });
  mockGraphqlRequest.mockResolvedValue({
    insert_session_verification_v4: { affected_rows: 1 },
  });
});

// #region Collection eligibility
describe("v4 session proof analytics [collection eligibility]", () => {
  it("records one partial-success session with the number of successful results", async () => {
    (processSessionProof as jest.Mock).mockResolvedValue([
      success,
      failure,
      { ...success, identifier: "orb", nullifier: "3" },
    ]);

    const response = await verify();

    expect(response.status).toBe(200);
    expect(getSessionAnalyticsGraphqlClient).toHaveBeenCalledTimes(1);
    expect(getAPIServiceGraphqlClient).not.toHaveBeenCalled();
    expect(mockGraphqlRequest).toHaveBeenCalledTimes(1);
    const insertOperation = print(mockGraphqlRequest.mock.calls[0][0]);
    expect(insertOperation).toContain("mutation InsertSessionVerificationV4");
    expect(insertOperation).toContain("insert_session_verification_v4");
    expect(mockGraphqlRequest.mock.calls[0][1]).toEqual({
      object: {
        rp_id: rpId,
        environment: "production",
        session_id: baseParams.session_id,
        successful_results: 2,
      },
    });
  });

  it("does not collect an all-failed session", async () => {
    (processSessionProof as jest.Mock).mockResolvedValue([
      failure,
      { ...failure, identifier: "orb" },
    ]);

    const response = await verify();

    expect(response.status).toBe(400);
    expect(getSessionAnalyticsGraphqlClient).not.toHaveBeenCalled();
    expect(mockGraphqlRequest).not.toHaveBeenCalled();
  });

  it("does not collect when proof processing throws", async () => {
    (processSessionProof as jest.Mock).mockRejectedValue(
      new Error("verifier transport failed"),
    );

    await expect(verify()).rejects.toThrow("verifier transport failed");

    expect(getSessionAnalyticsGraphqlClient).not.toHaveBeenCalled();
    expect(mockGraphqlRequest).not.toHaveBeenCalled();
  });

  it("stores sandbox verifications as staging while preserving the response environment", async () => {
    (processSessionProof as jest.Mock).mockResolvedValue([success]);

    const response = await verify({ environment: "sandbox" });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.environment).toBe("sandbox");
    expect(processSessionProof).toHaveBeenCalledWith(
      123n,
      expect.anything(),
      "0xstaging",
    );
    expect(mockGraphqlRequest.mock.calls[0][1]).toEqual({
      object: expect.objectContaining({ environment: "staging" }),
    });
  });
});
// #endregion

// #region Best-effort availability
describe("v4 session proof analytics [best effort]", () => {
  it("returns the successful verification when the analytics insert rejects", async () => {
    const insertError = new Error("Hasura unavailable");
    (processSessionProof as jest.Mock).mockResolvedValue([success]);
    mockGraphqlRequest.mockRejectedValue(insertError);

    const response = await verify();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(logger.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        error: insertError,
        rp_id: rpId,
        session_id: baseParams.session_id,
      }),
    );
  });
});
// #endregion
