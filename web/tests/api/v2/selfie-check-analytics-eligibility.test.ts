import { GET } from "@/api/v2/apps/[app_id]/selfie-check-analytics/eligibility";
import { NextRequest } from "next/server";

// #region Mocks
const getIsUserAllowedToReadApp = jest.fn();
const getSessionMock = jest.fn();
const isEnabledForAppMock = jest.fn();

jest.mock("@/lib/permissions", () => ({
  getIsUserAllowedToReadApp: (...args: unknown[]) =>
    getIsUserAllowedToReadApp(...args),
}));

jest.mock("@/lib/auth0", () => ({
  auth0: { getSession: (...args: unknown[]) => getSessionMock(...args) },
}));

jest.mock("@/api/helpers/selfie-check-analytics/eligibility", () => ({
  isSelfieCheckAnalyticsEnabledForApp: (...args: unknown[]) =>
    isEnabledForAppMock(...args),
}));

jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));
// #endregion

// #region Test Data
const appId = "app_0123456789abcdef0123456789abcdef";

const request = () =>
  new NextRequest(
    `http://localhost:3000/api/v2/apps/${appId}/selfie-check-analytics/eligibility`,
  );

const context = (id = appId) => ({ params: Promise.resolve({ app_id: id }) });
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  getSessionMock.mockResolvedValue({
    user: { hasura: { id: "user_0123456789abcdef0123456789abcdef" } },
  });
  getIsUserAllowedToReadApp.mockResolvedValue(true);
  isEnabledForAppMock.mockResolvedValue(true);
});

describe("GET /api/v2/apps/[app_id]/selfie-check-analytics/eligibility", () => {
  it("returns explicit eligibility for an allowlisted app", async () => {
    const response = await GET(request(), context());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ isEligible: true });
    expect(response.headers.get("cache-control")).toBe("private, max-age=60");
    expect(isEnabledForAppMock).toHaveBeenCalledWith(appId);
  });

  it("returns explicit false for an app outside the rollout", async () => {
    isEnabledForAppMock.mockResolvedValue(false);

    const response = await GET(request(), context());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ isEligible: false });
  });

  it("rejects an invalid app ID before any I/O", async () => {
    const response = await GET(request(), context("invalid"));

    expect(response.status).toBe(400);
    expect(getSessionMock).not.toHaveBeenCalled();
  });

  it("returns 401 without an authenticated session", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await GET(request(), context());

    expect(response.status).toBe(401);
    expect(isEnabledForAppMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the user is not a member of the app's team", async () => {
    getIsUserAllowedToReadApp.mockResolvedValue(false);

    const response = await GET(request(), context());

    expect(response.status).toBe(404);
    expect(isEnabledForAppMock).not.toHaveBeenCalled();
  });

  it("returns 503 when membership authorization is unavailable", async () => {
    getIsUserAllowedToReadApp.mockRejectedValue(new Error("Hasura timeout"));

    const response = await GET(request(), context());

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
