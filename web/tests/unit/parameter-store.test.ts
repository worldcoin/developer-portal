import { ParameterStore } from "@/lib/parameter-store";
import { ParameterNotFound, SSMClient } from "@aws-sdk/client-ssm";

// #region Mocks
jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

afterEach(() => {
  jest.restoreAllMocks();
});

// #region Missing parameter caching
describe("ParameterStore.getParameter", () => {
  it("caches the default for a missing parameter when requested", async () => {
    const send = jest.spyOn(SSMClient.prototype, "send");
    send.mockImplementation(() =>
      Promise.reject(
        new ParameterNotFound({ $metadata: {}, message: "Missing parameter" }),
      ),
    );
    const store = new ParameterStore("developer-portal");

    expect(
      await store.getParameter("whitelisted-apps/grant-claiming", [], {
        cacheNotFound: true,
      }),
    ).toEqual([]);
    expect(
      await store.getParameter("whitelisted-apps/grant-claiming", [], {
        cacheNotFound: true,
      }),
    ).toEqual([]);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("retries transient errors even when missing parameters are cached", async () => {
    const send = jest.spyOn(SSMClient.prototype, "send");
    send.mockImplementation(() => Promise.reject(new Error("SSM unavailable")));
    const store = new ParameterStore("developer-portal");

    expect(
      await store.getParameter("whitelisted-apps/grant-claiming", [], {
        cacheNotFound: true,
      }),
    ).toEqual([]);
    expect(
      await store.getParameter("whitelisted-apps/grant-claiming", [], {
        cacheNotFound: true,
      }),
    ).toEqual([]);
    expect(send).toHaveBeenCalledTimes(2);
  });
});
// #endregion
