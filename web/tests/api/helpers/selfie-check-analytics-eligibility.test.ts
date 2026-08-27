import { isSelfieCheckAnalyticsEnabledForApp } from "@/api/helpers/selfie-check-analytics/eligibility";
import { logger } from "@/lib/logger";

// #region Mocks
jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));
// #endregion

// #region Test Data
const appId = "app_0123456789abcdef0123456789abcdef";
const originalParameterStore = global.ParameterStore;

const setParameterStore = (getParameter: jest.Mock) => {
  global.ParameterStore = {
    getParameter,
  } as unknown as NonNullable<typeof global.ParameterStore>;
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  global.ParameterStore = undefined;
});

afterAll(() => {
  global.ParameterStore = originalParameterStore;
});

// #region Eligibility behavior
describe("isSelfieCheckAnalyticsEnabledForApp", () => {
  it("fails closed when Parameter Store is unavailable", async () => {
    await expect(isSelfieCheckAnalyticsEnabledForApp(appId)).resolves.toBe(
      false,
    );
  });

  it("enables an app included in the StringList parameter", async () => {
    const getParameter = jest.fn().mockResolvedValue([` ${appId} `]);
    setParameterStore(getParameter);

    await expect(isSelfieCheckAnalyticsEnabledForApp(appId)).resolves.toBe(
      true,
    );
    expect(getParameter).toHaveBeenCalledWith(
      "whitelisted-apps/selfie-check-analytics",
      [],
    );
  });

  it("accepts a comma-separated String parameter", async () => {
    const getParameter = jest
      .fn()
      .mockResolvedValue(`app_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa, ${appId}`);
    setParameterStore(getParameter);

    await expect(isSelfieCheckAnalyticsEnabledForApp(appId)).resolves.toBe(
      true,
    );
  });

  it("keeps apps absent from the parameter disabled", async () => {
    setParameterStore(
      jest.fn().mockResolvedValue(["app_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"]),
    );

    await expect(isSelfieCheckAnalyticsEnabledForApp(appId)).resolves.toBe(
      false,
    );
  });

  it("fails closed and logs malformed parameter values", async () => {
    setParameterStore(jest.fn().mockResolvedValue({ appId }));

    await expect(isSelfieCheckAnalyticsEnabledForApp(appId)).resolves.toBe(
      false,
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("invalid value"),
      expect.objectContaining({ failureClass: "InvalidParameterValue" }),
    );
  });

  it("fails closed when the Parameter Store call throws", async () => {
    setParameterStore(jest.fn().mockRejectedValue(new Error("SSM timeout")));

    await expect(isSelfieCheckAnalyticsEnabledForApp(appId)).resolves.toBe(
      false,
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("feature remains disabled"),
      expect.objectContaining({
        dependency: "ssm",
        failureClass: "Error",
      }),
    );
  });
});
// #endregion
