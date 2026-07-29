// #region Mocks
jest.mock("server-only", () => ({}));

jest.mock("@/api/helpers/jwts", () => ({
  generateAPIKeyJWT: jest.fn(),
  generateInternalDashboardJWT: jest.fn(),
  generateReviewerJWT: jest.fn(),
  generateServiceJWT: jest.fn().mockResolvedValue("service-token"),
}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Session analytics client contract
describe("session analytics GraphQL client", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it("uses its two-second no-retry policy in the dedicated client", async () => {
    jest.useFakeTimers();
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

    const {
      getSessionAnalyticsGraphqlClient,
      sessionAnalyticsGraphqlFetchPolicy,
    } = await import("@/api/helpers/graphql");

    expect(sessionAnalyticsGraphqlFetchPolicy).toEqual({
      clientName: "session_analytics",
      retryBackoffsMs: [],
      timeoutMs: 2_000,
    });

    const client = await getSessionAnalyticsGraphqlClient();
    const request = client.request(
      "query SessionAnalyticsPolicy { __typename }",
    );
    let settled = false;
    void request.then(
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
    await expect(request).rejects.toMatchObject({ name: "TimeoutError" });
    expect(settled).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
// #endregion
