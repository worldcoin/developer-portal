import { GET } from "@/api/v2/apps/[app_id]/selfie-check-analytics";
import { clearTableCaches } from "@/api/helpers/selfie-check-analytics/snapshots";
import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import {
  appId,
  otherAppId,
  userId,
  source,
  totalsCsv,
  dailyCsv,
} from "../../fixtures/selfie-check-analytics";

// #region Mocks
const getSession = jest.fn();
const GetIsUserPermittedToReadApp = jest.fn();
const listCsv = jest.fn();
const downloadCsv = jest.fn();
jest.mock("@/lib/auth0", () => ({ auth0: { getSession: () => getSession() } }));
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));
jest.mock(
  "@/lib/permissions/graphql/server/get-app-read-permissions.generated",
  () => ({
    getSdk: () => ({
      GetIsUserPermittedToReadApp: (...args: unknown[]) =>
        GetIsUserPermittedToReadApp(...args),
    }),
  }),
);
jest.mock("@/api/helpers/selfie-check-analytics/s3", () => ({
  listCsv: (...args: unknown[]) => listCsv(...args),
  downloadCsv: (...args: unknown[]) => downloadCsv(...args),
}));
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));
// #endregion

// #region Test Data
const request = (table = "total", etag?: string) =>
  new NextRequest(
    `http://localhost:3000/api/v2/apps/${appId}/selfie-check-analytics?table=${table}`,
    { headers: etag ? { "If-None-Match": etag } : undefined },
  );
const context = (id = appId) => ({ params: Promise.resolve({ app_id: id }) });
const refresh = () => jest.advanceTimersByTime(60_000);
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  clearTableCaches();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-08-26T22:00:00Z"));
  getSession.mockResolvedValue({ user: { hasura: { id: userId } } });
  GetIsUserPermittedToReadApp.mockResolvedValue({
    app_by_pk: { team: { memberships: [{ id: "membership" }] } },
  });
  listCsv.mockImplementation((prefix: string) =>
    Promise.resolve(source(prefix)),
  );
  downloadCsv.mockImplementation((object: ReturnType<typeof source>) =>
    Promise.resolve({
      object,
      csv: object.key.startsWith("total/")
        ? totalsCsv([appId, otherAppId])
        : dailyCsv(),
    }),
  );
});
afterEach(() => jest.useRealTimers());

// #region Success and conditional requests
describe("analytics API [success]", () => {
  it.each(["total", "daily"])(
    "returns authorized %s data and revalidates with 304",
    async (table) => {
      const first = await GET(request(table), context());
      expect(first.status).toBe(200);
      expect(first.headers.get("cache-control")).toBe("private, max-age=60");
      const body = await first.json();
      expect(body.appId).toBe(appId);
      expect(body.snapshotMetadata).toEqual({
        dataAsOf: "2026-08-26T21:00:00.000Z",
        isFallback: false,
      });
      if (table === "total") {
        expect(body.row.n_proof_shared_sessions).toBe(0);
        expect(listCsv).toHaveBeenCalledTimes(1);
      } else {
        expect(body.rows).toHaveLength(1);
        expect(listCsv.mock.calls).toEqual([["total/"], ["daily/"]]);
      }
      expect(GetIsUserPermittedToReadApp).toHaveBeenCalledWith({
        appId,
        userId,
      });
      const second = await GET(
        request(table, first.headers.get("etag")!),
        context(),
      );
      expect(second.status).toBe(304);
      expect(await second.text()).toBe("");
      expect(GetIsUserPermittedToReadApp).toHaveBeenCalledTimes(2);
    },
  );

  it("supports totals-only apps but returns normal absence for missing daily rows", async () => {
    downloadCsv.mockImplementation((object: ReturnType<typeof source>) =>
      Promise.resolve({
        object,
        csv: object.key.startsWith("total/")
          ? totalsCsv()
          : dailyCsv([otherAppId]),
      }),
    );
    expect((await GET(request(), context())).status).toBe(200);
    expect((await GET(request("daily"), context())).status).toBe(404);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it.each(["total", "daily"])(
    "requires totals membership for %s, including daily-only apps",
    async (table) => {
      downloadCsv.mockImplementation((object: ReturnType<typeof source>) =>
        Promise.resolve({
          object,
          csv: object.key.startsWith("total/")
            ? totalsCsv([otherAppId])
            : dailyCsv(),
        }),
      );
      const response = await GET(request(table), context());
      expect(response.status).toBe(403);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.json()).toEqual({
        code: "analytics_not_enabled",
        detail:
          "Selfie Check analytics aren't available for this app yet. Contact us to learn more.",
        attribute: null,
      });
      expect(listCsv.mock.calls).toEqual([["total/"]]);
      expect(logger.warn).not.toHaveBeenCalled();
    },
  );

  it.each(["total", "daily"])(
    "checks removal after refresh before returning a %s 304",
    async (table) => {
      const first = await GET(request(table), context());
      listCsv.mockImplementation((prefix: string) =>
        Promise.resolve(source(prefix, 2)),
      );
      downloadCsv.mockImplementation((object: ReturnType<typeof source>) =>
        Promise.resolve({
          object,
          csv: object.key.startsWith("total/")
            ? totalsCsv([otherAppId])
            : dailyCsv(),
        }),
      );
      refresh();
      expect(
        (await GET(request(table, first.headers.get("etag")!), context()))
          .status,
      ).toBe(403);
    },
  );
});
// #endregion

// #region Authorization and validation
describe("analytics API [guards]", () => {
  it("rejects invalid input before I/O", async () => {
    expect((await GET(request(), context("invalid"))).status).toBe(400);
    expect((await GET(request("weekly"), context())).status).toBe(400);
    expect(getSession).not.toHaveBeenCalled();
    expect(listCsv).not.toHaveBeenCalled();
  });

  it.each(["total", "daily"])(
    "checks authentication before %s membership or 304",
    async (table) => {
      const first = await GET(request(table), context());
      listCsv.mockClear();
      getSession.mockResolvedValue(null);
      expect(
        (await GET(request(table, first.headers.get("etag")!), context()))
          .status,
      ).toBe(401);
      expect(listCsv).not.toHaveBeenCalled();
    },
  );

  it.each(["total", "daily"])(
    "checks app access before %s membership or 304",
    async (table) => {
      const first = await GET(request(table), context());
      clearTableCaches();
      listCsv.mockClear();
      GetIsUserPermittedToReadApp.mockResolvedValue({ app_by_pk: null });
      expect(
        (await GET(request(table, first.headers.get("etag")!), context()))
          .status,
      ).toBe(404);
      expect(listCsv).not.toHaveBeenCalled();
    },
  );

  it.each(["auth0", "hasura"])(
    "reports %s outages before snapshot I/O",
    async (dependency) => {
      (dependency === "auth0"
        ? getSession
        : GetIsUserPermittedToReadApp
      ).mockRejectedValue(new Error("Unavailable"));
      const response = await GET(request(), context());
      expect(response.status).toBe(503);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(listCsv).not.toHaveBeenCalled();
    },
  );

  it("cannot bypass membership with preview query parameters or a production environment", async () => {
    const previous = process.env.NODE_ENV;
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "production",
      configurable: true,
      writable: true,
    });
    try {
      downloadCsv.mockImplementation((object: ReturnType<typeof source>) =>
        Promise.resolve({ object, csv: totalsCsv([otherAppId]) }),
      );
      const req = new NextRequest(
        `http://localhost/api/v2/apps/${appId}/selfie-check-analytics?mock=true&preview=true`,
      );
      expect((await GET(req, context())).status).toBe(403);
    } finally {
      Object.defineProperty(process.env, "NODE_ENV", {
        value: previous,
        configurable: true,
        writable: true,
      });
    }
  });
});
// #endregion

// #region Dependency failures, verified fallback, and recovery
describe("analytics API [failures]", () => {
  it.each(["timeout", "malformed"])(
    "returns retryable 503 for a cold %s export failure",
    async (failure) => {
      if (failure === "malformed")
        downloadCsv.mockResolvedValue({ object: source(), csv: "invalid,csv" });
      else listCsv.mockRejectedValue(new Error(`S3 ${failure}`));
      const response = await GET(request(), context());
      expect(response.status).toBe(503);
      expect(response.headers.get("retry-after")).toBe("60");
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.json()).toMatchObject({
        code: "temporarily_unavailable",
      });
      expect(logger.error).toHaveBeenCalled();
    },
  );

  it("reports a daily outage without losing available totals", async () => {
    listCsv.mockImplementation((prefix: string) =>
      prefix === "daily/"
        ? Promise.reject(new Error("S3 503"))
        : Promise.resolve(source(prefix)),
    );
    expect((await GET(request("daily"), context())).status).toBe(503);
    expect((await GET(request(), context())).status).toBe(200);
  });

  it.each(["total", "daily"])(
    "changes the %s ETag on fallback and recovery",
    async (table) => {
      const first = await GET(request(table), context());
      listCsv.mockRejectedValue(new Error("S3 timeout"));
      refresh();
      const fallback = await GET(
        request(table, first.headers.get("etag")!),
        context(),
      );
      expect(fallback.status).toBe(200);
      expect(await fallback.json()).toMatchObject({
        snapshotMetadata: { isFallback: true },
      });
      expect(
        (await GET(request(table, fallback.headers.get("etag")!), context()))
          .status,
      ).toBe(304);
      listCsv.mockImplementation((prefix: string) =>
        Promise.resolve(source(prefix)),
      );
      refresh();
      const recovered = await GET(
        request(table, fallback.headers.get("etag")!),
        context(),
      );
      expect(recovered.status).toBe(200);
      expect(await recovered.json()).toMatchObject({
        snapshotMetadata: { isFallback: false },
      });
    },
  );

  it("marks daily data stale when only its totals membership check falls back", async () => {
    await GET(request("daily"), context());
    listCsv.mockImplementation((prefix: string) =>
      prefix === "total/"
        ? Promise.reject(new Error("S3 503"))
        : Promise.resolve(source(prefix)),
    );
    refresh();
    const response = await GET(request("daily"), context());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      snapshotMetadata: { isFallback: true },
    });
  });
});
// #endregion
