// #region Mocks
const mockProcessSessionProof = jest.fn();

jest.mock("server-only", () => ({}));

jest.mock("@/api/helpers/jwts", () => ({
  generateAPIKeyJWT: jest.fn(),
  generateInternalDashboardJWT: jest.fn(),
  generateReviewerJWT: jest.fn(),
  generateServiceJWT: jest.fn().mockResolvedValue("service-token"),
}));

jest.mock("@/api/helpers/rp-utils", () => ({
  parseRpId: jest.fn().mockReturnValue(123n),
}));

jest.mock("@/api/v4/verify/session-proof/verify-util", () => ({
  processSessionProof: (...args: unknown[]) => mockProcessSessionProof(...args),
}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("../../../services/posthogClient", () => ({
  captureEvent: jest.fn().mockResolvedValue(undefined),
}));
// #endregion

// #region Test Data
const sessionParams = {
  session_id: "session-timeout-test",
  nonce: "1",
  protocol_version: "4.0" as const,
  responses: [
    {
      identifier: "face",
      signal_hash: "0x0",
      issuer_schema_id: "1",
      session_nullifier: ["1", "2"] as [string, string],
      expires_at_min: "1800000000",
      proof: ["1", "2", "3", "4", "5"] as [
        string,
        string,
        string,
        string,
        string,
      ],
    },
  ],
};
// #endregion

describe("v4 session proof analytics [real client timeout]", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.useFakeTimers();
    process.env.VERIFIER_CONTRACT_ADDRESS = "0xproduction";
    mockProcessSessionProof.mockResolvedValue([
      {
        identifier: "face",
        sessionId: sessionParams.session_id,
        success: true,
        nullifier: "1",
      },
    ]);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it("returns the verification at 2000ms when the analytics fetch hangs", async () => {
    const timeoutController = new AbortController();
    const timeoutError = Object.assign(new Error("analytics timeout"), {
      name: "TimeoutError",
    });
    const timeoutSpy = jest
      .spyOn(AbortSignal, "timeout")
      .mockImplementation((timeoutMs) => {
        setTimeout(() => timeoutController.abort(timeoutError), timeoutMs);
        return timeoutController.signal;
      });
    const fetchMock = jest.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(init.signal?.reason),
            { once: true },
          );
        }),
    );
    global.fetch = fetchMock as typeof fetch;

    const [{ handleSessionProofVerification }, { logger }] = await Promise.all([
      import("@/api/v4/verify/session-proof/handler"),
      import("@/lib/logger"),
    ]);

    const responsePromise = handleSessionProofVerification(
      "rp_0123456789abcdef",
      "app_0123456789abcdef0123456789abcdef",
      sessionParams,
    );
    let settled = false;
    void responsePromise.then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      },
    );

    await jest.advanceTimersByTimeAsync(0);
    await jest.advanceTimersByTimeAsync(1_999);
    expect(settled).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(timeoutSpy).toHaveBeenCalledWith(2_000);

    await jest.advanceTimersByTimeAsync(1);
    const response = await responsePromise;

    expect(response.status).toBe(200);
    expect(settled).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});
