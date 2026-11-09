import { POST } from "@/api/_bot-fence/rp-usage";
import { NextRequest } from "next/server";

// #region Mocks
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

const GetRpUsage = jest.fn();
jest.mock("@/api/_bot-fence/rp-usage/graphql/get-rp-usage.generated", () => ({
  getSdk: () => ({ GetRpUsage }),
}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test Data
const TOKEN = "bot-fence-usage-token";
const RP_ID = "rp_0123456789abcdef";
// 2026-11-09T10:00:00Z, one closed hour
const FROM = 1794218400;
const TO = FROM + 3600;
const DAY = 24 * 60 * 60;

const createRequest = (
  body: unknown,
  authorization: string | null = `Bearer ${TOKEN}`,
) =>
  new NextRequest("http://localhost:3000/api/_bot-fence/rp-usage", {
    method: "POST",
    headers: authorization ? { Authorization: authorization } : {},
    body: JSON.stringify(body),
  });

const usage = (count: number, minCreatedAt: string | null) => ({
  nullifier_v4_aggregate: {
    aggregate: { count, min: { created_at: minCreatedAt } },
  },
});
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  process.env.BOT_FENCE_USAGE_TOKEN = TOKEN;
  process.env.INTERNAL_ENDPOINTS_SECRET = "internal-secret";
  GetRpUsage.mockResolvedValue(usage(0, null));
});

// #region Auth
describe("/api/_bot-fence/rp-usage [auth]", () => {
  it("rejects requests without a token", async () => {
    const res = (await POST(
      createRequest({ rp_id: RP_ID, from: FROM, to: TO }, null),
    ))!;

    expect(res.status).toBe(403);
    expect(GetRpUsage).not.toHaveBeenCalled();
  });

  it("rejects the general internal secret", async () => {
    const res = (await POST(
      createRequest(
        { rp_id: RP_ID, from: FROM, to: TO },
        "Bearer internal-secret",
      ),
    ))!;

    expect(res.status).toBe(403);
    expect(GetRpUsage).not.toHaveBeenCalled();
  });

  it("rejects every request when the token is not configured", async () => {
    delete process.env.BOT_FENCE_USAGE_TOKEN;

    const res = (await POST(
      createRequest({ rp_id: RP_ID, from: FROM, to: TO }, "Bearer "),
    ))!;

    expect(res.status).toBe(403);
    expect(GetRpUsage).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Validation
describe("/api/_bot-fence/rp-usage [validation]", () => {
  it.each([
    ["an invalid rp_id", { rp_id: "app_0123456789abcdef", from: FROM, to: TO }],
    ["string timestamps", { rp_id: RP_ID, from: String(FROM), to: TO }],
    ["an empty range", { rp_id: RP_ID, from: FROM, to: FROM }],
    ["a reversed range", { rp_id: RP_ID, from: TO, to: FROM }],
    [
      "a range over 31 days",
      { rp_id: RP_ID, from: FROM, to: FROM + 31 * DAY + 1 },
    ],
    [
      "an unknown environment",
      { rp_id: RP_ID, from: FROM, to: TO, environment: "sandbox" },
    ],
  ])("returns 400 for %s", async (_, body) => {
    const res = (await POST(createRequest(body)))!;

    expect(res.status).toBe(400);
    expect(GetRpUsage).not.toHaveBeenCalled();
  });

  it("accepts a range of exactly 31 days", async () => {
    const res = (await POST(
      createRequest({ rp_id: RP_ID, from: FROM, to: FROM + 31 * DAY }),
    ))!;

    expect(res.status).toBe(200);
  });
});
// #endregion

// #region Counting
describe("/api/_bot-fence/rp-usage [counting]", () => {
  it("counts production usage in [from, to) and floors first_created_at", async () => {
    GetRpUsage.mockResolvedValue(usage(42, "2026-11-09T10:15:30.987654+00:00"));

    const res = (await POST(
      createRequest({ rp_id: RP_ID, from: FROM, to: TO }),
    ))!;

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      rp_id: RP_ID,
      environment: "production",
      from: FROM,
      to: TO,
      count: 42,
      first_created_at: FROM + 15 * 60 + 30,
    });
    expect(GetRpUsage).toHaveBeenCalledWith({
      rp_id: RP_ID,
      environment: "production",
      from: "2026-11-09T10:00:00.000Z",
      to: "2026-11-09T11:00:00.000Z",
    });
  });

  it("returns a zero count and null first_created_at when there is no usage", async () => {
    const res = (await POST(
      createRequest({
        rp_id: RP_ID,
        from: FROM,
        to: TO,
        environment: "staging",
      }),
    ))!;

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      environment: "staging",
      count: 0,
      first_created_at: null,
    });
    expect(GetRpUsage).toHaveBeenCalledWith(
      expect.objectContaining({ environment: "staging" }),
    );
  });

  it("returns 500 when the query fails", async () => {
    GetRpUsage.mockRejectedValue(new Error("hasura down"));

    const res = (await POST(
      createRequest({ rp_id: RP_ID, from: FROM, to: TO }),
    ))!;

    expect(res.status).toBe(500);
  });
});
// #endregion
