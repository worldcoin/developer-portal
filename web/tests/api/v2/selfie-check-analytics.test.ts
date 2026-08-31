import { GET } from "@/api/v2/apps/[app_id]/selfie-check-analytics";
import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";

// #region Mocks
const getIsUserAllowedToReadApp = jest.fn();
const getSessionMock = jest.fn();
const getTotalsAppSnapshotMock = jest.fn();
const getDailyAppSnapshotMock = jest.fn();

jest.mock("@/lib/permissions", () => ({
  getIsUserAllowedToReadApp: (...args: unknown[]) =>
    getIsUserAllowedToReadApp(...args),
}));

jest.mock("@/lib/auth0", () => ({
  auth0: { getSession: (...args: unknown[]) => getSessionMock(...args) },
}));

jest.mock("@/api/helpers/selfie-check-analytics/redis-store", () => ({
  getTotalsAppSnapshot: (...args: unknown[]) =>
    getTotalsAppSnapshotMock(...args),
  getDailyAppSnapshot: (...args: unknown[]) => getDailyAppSnapshotMock(...args),
}));

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
const userId = "user_0123456789abcdef0123456789abcdef";

const completeRow = {
  appId,
  n_users_started_selfie_check_flow: 10,
  n_proofs: 3,
  n_proof_users: 8,
  n_face_auth_started_sessions: 10,
  n_face_auth_completed_sessions: 8,
  p_face_auth_completion: 0.75,
};

const dailyRows = [
  {
    appId,
    day: "2026-08-25",
    os_name: "iOS",
    n_users_started_selfie_check_flow: 10,
    n_proofs: 2,
    n_proof_users: 8,
    cumulative_n_proofs: 27,
    cumulative_n_proof_users: 20,
    n_face_auth_started_sessions: 10,
    n_face_auth_completed_sessions: 8,
    p_face_auth_completion: 0.8,
  },
];

const metadata = (dataset: "totals" | "daily") => ({
  dataset,
  snapshotUID: `${dataset}-snapshot`,
  appCount: 1,
  publishedAt: "2026-08-26T22:00:00.000Z",
  lastCheckedAt: "2026-08-26T22:01:00.000Z",
  source: {
    etag: '"source-etag"',
    identity: `${dataset}:source-identity`,
    key: `${dataset}/run-1.csv`,
    dataAsOf: "2026-08-26T21:00:00.000Z",
    lastModified: "2026-08-26T21:00:00.000Z",
    sizeBytes: 100,
  },
});

const totalsSnapshot = () => ({
  data: completeRow,
  metadata: metadata("totals"),
});

const dailySnapshot = () => ({
  data: dailyRows,
  metadata: metadata("daily"),
});

const request = (etag?: string, query = "") =>
  new NextRequest(
    `http://localhost:3000/api/v2/apps/${appId}/selfie-check-analytics${query}`,
    { headers: etag ? { "If-None-Match": etag } : undefined },
  );

const context = (id = appId) => ({
  params: Promise.resolve({ app_id: id }),
});
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  getSessionMock.mockResolvedValue({
    user: { hasura: { id: userId } },
  });
  getIsUserAllowedToReadApp.mockResolvedValue(true);
  getTotalsAppSnapshotMock.mockResolvedValue(totalsSnapshot());
  getDailyAppSnapshotMock.mockResolvedValue(dailySnapshot());
});

// #region Success and cache behavior
describe("GET /api/v2/apps/[app_id]/selfie-check-analytics [success]", () => {
  it("returns the authorized app's totals row from Redis", async () => {
    const response = await GET(request(), context());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      appId,
      tablePrefix: "total/",
      row: completeRow,
      meta: {
        dataAsOf: "2026-08-26T21:00:00.000Z",
        isFallback: false,
      },
    });
    expect(response.headers.get("cache-control")).toBe("private, max-age=60");
    expect(response.headers.get("etag")).toMatch(/^"[A-Za-z0-9_-]+"$/);
    expect(getIsUserAllowedToReadApp).toHaveBeenCalledWith(appId);
    expect(getTotalsAppSnapshotMock).toHaveBeenCalledWith(appId);
    expect(getDailyAppSnapshotMock).not.toHaveBeenCalled();
  });

  it("returns 304 when the Redis snapshot ETag matches", async () => {
    const firstResponse = await GET(request(), context());
    const etag = firstResponse.headers.get("etag")!;

    const response = await GET(request(etag), context());

    expect(response.status).toBe(304);
    expect(await response.text()).toBe("");
    expect(response.headers.get("etag")).toBe(etag);
  });

  it("checks totals eligibility before returning daily Redis rows", async () => {
    const response = await GET(request(undefined, "?table=daily"), context());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      appId,
      tablePrefix: "daily/",
      rows: dailyRows,
      meta: {
        dataAsOf: "2026-08-26T21:00:00.000Z",
        isFallback: false,
      },
    });
    expect(getTotalsAppSnapshotMock).toHaveBeenCalledWith(appId);
    expect(getDailyAppSnapshotMock).toHaveBeenCalledWith(appId);
    expect(getTotalsAppSnapshotMock.mock.invocationCallOrder[0]).toBeLessThan(
      getDailyAppSnapshotMock.mock.invocationCallOrder[0],
    );
  });
});
// #endregion

// #region Guards and failures
describe("GET /api/v2/apps/[app_id]/selfie-check-analytics [guards]", () => {
  it("rejects an invalid app ID before any I/O", async () => {
    const response = await GET(request(), context("invalid"));

    expect(response.status).toBe(400);
    expect(getSessionMock).not.toHaveBeenCalled();
    expect(getIsUserAllowedToReadApp).not.toHaveBeenCalled();
    expect(getTotalsAppSnapshotMock).not.toHaveBeenCalled();
  });

  it("rejects an unknown table parameter before any I/O", async () => {
    const response = await GET(request(undefined, "?table=weekly"), context());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "invalid_table",
    });
    expect(getSessionMock).not.toHaveBeenCalled();
    expect(getTotalsAppSnapshotMock).not.toHaveBeenCalled();
  });

  it("returns 401 without an authenticated session", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await GET(request(), context());

    expect(response.status).toBe(401);
    expect(getIsUserAllowedToReadApp).not.toHaveBeenCalled();
    expect(getTotalsAppSnapshotMock).not.toHaveBeenCalled();
  });

  it("returns 503 when the authentication dependency is unavailable", async () => {
    getSessionMock.mockRejectedValue(new Error("Auth0 unavailable"));

    const response = await GET(request(), context());

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(getIsUserAllowedToReadApp).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to authenticate selfie-check analytics request",
      expect.objectContaining({ dependency: "auth0", appId }),
    );
  });

  it("returns 404 when the user is not a member of the app's team", async () => {
    getIsUserAllowedToReadApp.mockResolvedValue(false);

    const response = await GET(request(), context());

    expect(response.status).toBe(404);
    expect(getTotalsAppSnapshotMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the app has no row in the totals snapshot", async () => {
    getTotalsAppSnapshotMock.mockResolvedValue(null);

    const response = await GET(request(), context());

    expect(response.status).toBe(404);
    expect(getDailyAppSnapshotMock).not.toHaveBeenCalled();
  });

  it("returns 404 when an eligible app is absent from the daily snapshot", async () => {
    getDailyAppSnapshotMock.mockResolvedValue(null);

    const response = await GET(request(undefined, "?table=daily"), context());

    expect(response.status).toBe(404);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("absent from the Redis snapshot"),
      expect.objectContaining({ dependency: "redis", appId }),
    );
  });

  it("returns 503 when membership authorization is unavailable", async () => {
    getIsUserAllowedToReadApp.mockRejectedValue(new Error("Hasura timeout"));

    const response = await GET(request(), context());

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(getTotalsAppSnapshotMock).not.toHaveBeenCalled();
  });

  it("returns retryable 503 when Redis is unavailable", async () => {
    getTotalsAppSnapshotMock.mockRejectedValue(new Error("Redis timeout"));

    const response = await GET(request(), context());

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to read selfie-check analytics from Redis",
      expect.objectContaining({
        dependency: "redis",
        dataset: "selfie_check_totals",
      }),
    );
  });
});
// #endregion
