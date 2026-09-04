import { POST as MCP_POST, POST_TEST_VERIFICATION } from "@/api/mcp";
import { generateHashedSecret } from "@/api/helpers/utils";
import { schema } from "@/api/v4/verify/request-schema";
import { NextRequest } from "next/server";

// #region Mocks
const authenticateTeam = jest.fn();
const appContext = jest.fn();
jest.mock("../../../api/mcp/graphql/authenticate-team.generated", () => ({
  getSdk: () => ({ McpAuthenticateTeam: authenticateTeam }),
}));
jest.mock("../../../api/mcp/graphql/app-context.generated", () => ({
  getSdk: () => ({ McpAppContext: appContext }),
}));
jest.mock("../../../api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));
jest.mock("../../../lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock("dd-trace", () => ({
  dogstatsd: { increment: jest.fn() },
}));
// #endregion

// #region Test Data
const appId = "app_0123456789abcdef0123456789abcdef";
const teamId = "team_0123456789abcdef0123456789abcdef";
const apiKeyId = "key_0123456789abcdef0123456789abcdef";
const rpId = "rp_0123456789abcdef";
const hashedSecret = generateHashedSecret(apiKeyId);
const token = `api_${Buffer.from(`${apiKeyId}:${hashedSecret.secret}`).toString("base64")}`;
const input = { app_id: appId, action: "signup" };
const redis = global.RedisClient!;
const originalFetch = global.fetch;
const makeApp = (overrides: Record<string, unknown> = {}) => ({
  id: appId,
  status: "active",
  is_archived: false,
  is_staging: false,
  rp_registration: [
    { rp_id: rpId, status: "registered", staging_status: "failed" },
  ],
  ...overrides,
});
const request = (body: unknown, headers: Record<string, string> = {}) =>
  new NextRequest("https://untrusted.example/api/v4/test-verifications", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
const callMcp = (body: unknown) =>
  MCP_POST(
    request({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "run_test_verification", arguments: body },
    }),
  );
// #endregion

beforeEach(async () => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  await redis.flushall();
  process.env.NEXT_PUBLIC_APP_URL = "https://developer.example";
  authenticateTeam.mockResolvedValue({
    api_key_by_pk: {
      id: apiKeyId,
      team_id: teamId,
      api_key: hashedSecret.hashed_secret,
      is_active: true,
    },
  });
  appContext.mockResolvedValue({ app: [makeApp()] });
  global.fetch = jest.fn();
});
afterEach(() => {
  global.fetch = originalFetch;
});

// #region Mint and authorization
describe("/api/v4/test-verifications [mint]", () => {
  it("mints a real stored staging payload through both transports even when the staging mirror failed", async () => {
    const rest = await POST_TEST_VERIFICATION(
      request({
        ...input,
        environment: "production",
        uses: 99,
        verify_url: "https://evil.example",
      }),
    );
    const result = await rest.json();
    expect(rest.status).toBe(200);
    expect(result).toMatchObject({
      test: true,
      verify_url: `https://developer.example/api/v4/verify/${rpId}`,
      payload: {
        protocol_version: "4.0",
        environment: "staging",
        action: "signup",
      },
    });
    await expect(schema.validate(result.payload)).resolves.toBeDefined();
    expect(Date.parse(result.expires_at) - Date.now()).toBeGreaterThan(590_000);
    expect(await redis.keys("test_proof:*")).toHaveLength(1);
    expect(appContext).toHaveBeenCalledWith({ team_id: teamId, app_id: appId });
    expect(global.fetch).not.toHaveBeenCalled();

    const mcp = await (await callMcp(input)).json();
    const mcpResult = JSON.parse(mcp.result.content[0].text);
    expect(mcpResult).toMatchObject({
      test: true,
      verify_url: result.verify_url,
    });
    expect(mcpResult.payload).toMatchObject({
      action: "signup",
      environment: "staging",
    });
    expect(await redis.keys("test_proof:*")).toHaveLength(2);
  });

  it.each([
    ["missing key", "", false],
    ["inactive key", `Bearer ${token}`, true],
  ])("rejects %s before app lookup", async (_, authorization, inactive) => {
    if (inactive)
      authenticateTeam.mockResolvedValue({
        api_key_by_pk: {
          id: apiKeyId,
          team_id: teamId,
          api_key: hashedSecret.hashed_secret,
          is_active: false,
        },
      });
    const res = await POST_TEST_VERIFICATION(request(input, { authorization }));
    expect(res.status).toBe(401);
    expect(appContext).not.toHaveBeenCalled();
    expect(await redis.keys("test_proof:*")).toHaveLength(0);
  });

  it("does not distinguish another team's app from a missing app", async () => {
    appContext.mockResolvedValue({ app: [] });
    const res = await POST_TEST_VERIFICATION(request(input));
    expect(res.status).toBe(404);
    expect((await res.json()).error.message).toBe(
      "App not found for this API key.",
    );
    expect(await redis.keys("test_proof:*")).toHaveLength(0);
  });

  it.each([
    ["archived", { is_archived: true }],
    ["inactive", { status: "inactive" }],
    ["staging", { is_staging: true }],
  ])("refuses an %s app before minting", async (_, overrides) => {
    appContext.mockResolvedValue({ app: [makeApp(overrides)] });
    expect((await POST_TEST_VERIFICATION(request(input))).status).toBe(409);
    expect(await redis.keys("test_proof:*")).toHaveLength(0);
  });

  it.each([
    ["missing", []],
    ["pending", [{ rp_id: rpId, status: "pending", staging_status: "failed" }]],
  ])("reports %s primary registration", async (_, rp_registration) => {
    appContext.mockResolvedValue({ app: [makeApp({ rp_registration })] });
    const res = await POST_TEST_VERIFICATION(request(input));
    expect(res.status).toBe(409);
    expect((await res.json()).error.data).toMatchObject({
      reason: "rp_not_registered",
    });
    expect(await redis.keys("test_proof:*")).toHaveLength(0);
  });

  it.each(["invalid_rp_signature", "below_sybil_threshold"])(
    "explicitly rejects the unsupported outcome %s",
    async (outcome) => {
      const res = await POST_TEST_VERIFICATION(request({ ...input, outcome }));
      expect(res.status).toBe(400);
      expect((await res.json()).error.data.join(" ")).toContain(
        "unavailable until their chain-verifier mappings are confirmed",
      );
      expect(appContext).not.toHaveBeenCalled();
    },
  );

  it("rejects malformed JSON", async () => {
    const req = new NextRequest(
      "https://developer.example/api/v4/test-verifications",
      {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        body: "{",
      },
    );
    expect((await POST_TEST_VERIFICATION(req)).status).toBe(400);
  });
});
// #endregion

// #region Rate limits and persistence
describe("/api/v4/test-verifications [dependencies]", () => {
  it("allows the last request in a window and rejects the next across transports", async () => {
    await redis.set(
      `ratelimit:mcp_run_test_verification:minute:${apiKeyId}`,
      "29",
      "EX",
      40,
    );
    expect((await (await callMcp(input)).json()).result).toBeDefined();
    expect((await POST_TEST_VERIFICATION(request(input))).status).toBe(429);
    expect(await redis.keys("test_proof:*")).toHaveLength(1);
  });
  it.each([
    ["minute", 30],
    ["day", 500],
  ])("shares the %s limit across MCP and REST", async (window, limit) => {
    await redis.set(
      `ratelimit:mcp_run_test_verification:${window}:${apiKeyId}`,
      String(limit),
      "EX",
      40,
    );
    const res = await POST_TEST_VERIFICATION(request(input));
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(0);
    const body = await res.json();
    expect(body.error).toMatchObject({ code: -32029, data: { window } });
    expect((await (await callMcp(input)).json()).error.code).toBe(-32029);
    expect(await redis.keys("test_proof:*")).toHaveLength(0);
  });

  it("fails open when rate-limit Redis fails while mint storage works", async () => {
    jest
      .spyOn(redis, "eval")
      .mockRejectedValueOnce(new Error("Redis unavailable"));
    expect((await POST_TEST_VERIFICATION(request(input))).status).toBe(200);
    expect(await redis.keys("test_proof:*")).toHaveLength(1);
  });

  it("bounds a stalled limiter and still requires a stored proof", async () => {
    jest
      .spyOn(redis, "eval")
      .mockImplementationOnce(() => new Promise(() => {}));
    expect((await POST_TEST_VERIFICATION(request(input))).status).toBe(200);
    expect(await redis.keys("test_proof:*")).toHaveLength(1);
  });

  it("refuses to return an untracked payload when mint storage fails", async () => {
    jest.spyOn(redis, "set").mockRejectedValueOnce(new Error("write failed"));
    const res = await POST_TEST_VERIFICATION(request(input));
    expect(res.status).toBe(503);
    expect((await res.json()).error.data.reason).toBe(
      "test_proof_store_unavailable",
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Direct mode
describe("/api/v4/test-verifications [direct]", () => {
  it.each(["development", "production"] as const)(
    "permits configured HTTP localhost only in development (%s)",
    async (nodeEnv) => {
      jest.replaceProperty(process, "env", {
        ...process.env,
        NODE_ENV: nodeEnv,
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      });
      const res = await POST_TEST_VERIFICATION(request(input));
      expect(res.status).toBe(nodeEnv === "development" ? 200 : 503);
      if (nodeEnv === "development")
        expect((await res.json()).verify_url).toBe(
          `http://localhost:3000/api/v4/verify/${rpId}`,
        );
    },
  );
  it("preserves a verify 400 as a completed test and posts only to the configured origin", async () => {
    const failed = {
      success: false,
      code: "all_verifications_failed",
      test: true,
    };
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify(failed), { status: 400 }),
    );
    const timeout = jest.spyOn(AbortSignal, "timeout");
    const res = await POST_TEST_VERIFICATION(
      request(
        { ...input, direct: true, outcome: "expired" },
        {
          host: "evil.example",
          "x-forwarded-host": "evil.example",
        },
      ),
    );
    const result = await res.json();
    expect(res.status).toBe(200);
    expect(result.direct_result).toEqual({ status: 400, body: failed });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(result.verify_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.payload),
      signal: expect.any(AbortSignal),
      redirect: "error",
      credentials: "omit",
    });
    expect(result.verify_url).toBe(
      `https://developer.example/api/v4/verify/${rpId}`,
    );
    expect(timeout).toHaveBeenCalledWith(10_000);
  });

  it.each([
    [
      "direct_timeout",
      () =>
        Promise.reject(
          Object.assign(new Error("timed out"), { name: "TimeoutError" }),
        ),
    ],
    [
      "direct_request_failed",
      () => Promise.reject(new TypeError("redirect or network failure")),
    ],
    [
      "direct_invalid_response",
      () => Promise.resolve(new Response("not JSON", { status: 502 })),
    ],
  ])(
    "reports %s without retry and retains the payload",
    async (reason, reply) => {
      (global.fetch as jest.Mock).mockImplementation(reply);
      const res = await POST_TEST_VERIFICATION(
        request({ ...input, direct: true }),
      );
      expect(res.status).toBe(503);
      expect((await res.json()).error.data).toMatchObject({
        reason,
        verification_outcome: "unknown",
        test: true,
        payload: { environment: "staging" },
      });
      expect(global.fetch).toHaveBeenCalledTimes(1);
    },
  );

  it.each(["", "http://example.com", "https://user:secret@example.com"])(
    "rejects an unsafe configured origin %s before minting",
    async (origin) => {
      process.env.NEXT_PUBLIC_APP_URL = origin;
      const res = await POST_TEST_VERIFICATION(
        request({ ...input, direct: true }),
      );
      expect(res.status).toBe(503);
      expect((await res.json()).error.data.reason).toBe(
        "verification_origin_unavailable",
      );
      expect(global.fetch).not.toHaveBeenCalled();
      expect(await redis.keys("test_proof:*")).toHaveLength(0);
    },
  );
});
// #endregion
