import { GraphQLClient } from "graphql-request";
import Redis from "ioredis";
import { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { createServer, Server } from "node:http";
import { AddressInfo } from "node:net";
import { Pool } from "pg";

// #region Mocks
jest.mock("../../../../lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock("dd-trace", () => ({ dogstatsd: { increment: jest.fn() } }));
jest.mock("../../../../api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: async () => {
    const { generateServiceJWT } = await import("@/api/helpers/jwts");
    return new GraphQLClient("http://127.0.0.1:8081/v1/graphql", {
      headers: { authorization: `Bearer ${await generateServiceJWT()}` },
    });
  },
}));
// #endregion

// #region Test data
const runIntegration =
  process.env.RUN_AGENT_TEST_VERIFICATION_INTEGRATION === "true"
    ? describe
    : describe.skip;
let appId: string;
const teamId = `team_${randomBytes(16).toString("hex")}`;
const rpId = `rp_${randomBytes(8).toString("hex")}`;
const apiKeyId = `key_${randomBytes(16).toString("hex")}`;
// #endregion

runIntegration("test verification [local Hasura, PostgreSQL and Redis]", () => {
  let pool: Pool;
  let redis: Redis;
  const servers: Server[] = [];
  let verifyOrigin: string;
  let mintUrl: string;
  let backendUrl: string;
  let authorization: string;
  const previousRedis = global.RedisClient;
  const previousNodeEnv = process.env.NODE_ENV;

  const startServer = async (
    path: string,
    handler: (request: NextRequest) => Promise<Response>,
  ): Promise<string> => {
    let origin: string;
    const server = createServer(async (request, response) => {
      if (request.url !== path) {
        response.writeHead(404, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: "Not found" }));
        return;
      }
      try {
        const chunks: Buffer[] = [];
        for await (const chunk of request) chunks.push(Buffer.from(chunk));
        const result = await handler(
          new NextRequest(`${origin}${path}`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: request.headers.authorization ?? "",
            },
            body: Buffer.concat(chunks).toString(),
          }),
        );
        const body = await result.text();
        response.writeHead(result.status, {
          "content-type": "application/json",
        });
        response.end(body);
      } catch (error) {
        console.error("Integration test server failed", error);
        response.writeHead(500, { "content-type": "application/json" });
        response.end(
          JSON.stringify({ error: "Integration test server failed" }),
        );
      }
    });
    servers.push(server);
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    return origin;
  };

  beforeEach(async () => {
    Object.assign(process.env, { NODE_ENV: "development" });
    process.env.NEXT_PUBLIC_APP_ENV = "development";
    process.env.NEXT_PUBLIC_POSTHOG_API_KEY = "";
    process.env.JWT_ISSUER = "local-integration-test";
    process.env.HASURA_GRAPHQL_JWT_SECRET = JSON.stringify({
      key: "unsafe_AnEsZxveGsAWoENHGAnEsZxveGsAvxgMtDq9UxgTsDq9UxgTsNHGWoENIoJ",
      type: "HS512",
    });
    process.env.VERIFIER_CONTRACT_ADDRESS_STAGING =
      "0x0000000000000000000000000000000000000001";

    pool = new Pool({
      host: "127.0.0.1",
      port: 5433,
      user: "postgres",
      password: "password",
      database: "postgres",
    });
    redis = new Redis("redis://127.0.0.1:6381", { maxRetriesPerRequest: 0 });
    global.RedisClient = redis;

    const { generateHashedSecret } = await import("@/api/helpers/utils");
    const { secret, hashed_secret } = generateHashedSecret(apiKeyId);
    authorization = `Bearer api_${Buffer.from(`${apiKeyId}:${secret}`).toString("base64")}`;
    await pool.query("INSERT INTO team (id, name) VALUES ($1, $2)", [
      teamId,
      "Agent test integration",
    ]);
    const createdApp = await pool.query(
      "INSERT INTO app (team_id, name, is_staging) VALUES ($1, $2, false) RETURNING id",
      [teamId, "Agent test integration"],
    );
    appId = createdApp.rows[0].id;
    await pool.query(
      "INSERT INTO rp_registration (rp_id, app_id, mode, status, staging_status) VALUES ($1, $2, 'managed', 'registered', 'failed')",
      [rpId, appId],
    );
    await pool.query(
      "INSERT INTO api_key (id, team_id, api_key) VALUES ($1, $2, $3)",
      [apiKeyId, teamId, hashed_secret],
    );

    const { POST: verify } = await import("@/api/v4/verify");
    const { POST_TEST_VERIFICATION: mint } = await import("@/api/mcp");
    verifyOrigin = await startServer(`/api/v4/verify/${rpId}`, (request) =>
      verify(request, { params: Promise.resolve({ app_id: rpId }) }),
    );
    process.env.NEXT_PUBLIC_APP_URL = verifyOrigin;
    const mintOrigin = await startServer("/api/v4/test-verifications", mint);
    mintUrl = `${mintOrigin}/api/v4/test-verifications`;
    const backendOrigin = await startServer(
      "/developer-backend",
      async (request) =>
        fetch(`${verifyOrigin}/api/v4/verify/${rpId}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: await request.text(),
        }),
    );
    backendUrl = `${backendOrigin}/developer-backend`;
  });

  afterEach(async () => {
    await Promise.all(
      servers
        .splice(0)
        .map(
          (server) =>
            new Promise<void>((resolve) => server.close(() => resolve())),
        ),
    );
    if (pool) {
      await pool.query("DELETE FROM api_key WHERE id = $1", [apiKeyId]);
      await pool.query("DELETE FROM rp_registration WHERE rp_id = $1", [rpId]);
      await pool.query("DELETE FROM app WHERE id = $1", [appId]);
      await pool.query("DELETE FROM team WHERE id = $1", [teamId]);
      await pool.end();
    }
    if (redis) await redis.quit();
    global.RedisClient = previousRedis;
    Object.assign(process.env, { NODE_ENV: previousNodeEnv });
  });

  it("verifies through a backend, retains real replay behavior and reports a direct failure", async () => {
    const mint = (input: Record<string, unknown>) =>
      fetch(mintUrl, {
        method: "POST",
        headers: { authorization, "content-type": "application/json" },
        body: JSON.stringify({ app_id: appId, action: "signup", ...input }),
      });
    const minted = await mint({});
    const result = await minted.json();
    expect({ status: minted.status, result }).toMatchObject({
      status: 200,
      result: { test: true, payload: { environment: "staging" } },
    });

    const unknownRoute = await fetch(`${verifyOrigin}/unknown-route`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(result.payload),
    });
    expect(unknownRoute.status).toBe(404);
    expect(await unknownRoute.json()).toEqual({ error: "Not found" });

    for (let attempt = 0; attempt < 2; attempt++) {
      const verified = await fetch(backendUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(result.payload),
      });
      expect({
        status: verified.status,
        body: await verified.json(),
      }).toMatchObject({
        status: 200,
        body: { success: true, test: true, environment: "staging" },
      });
    }

    const rejected = await mint({ outcome: "invalid_proof", direct: true });
    expect({
      status: rejected.status,
      body: await rejected.json(),
    }).toMatchObject({
      status: 200,
      body: {
        test: true,
        direct_result: {
          status: 400,
          body: {
            success: false,
            test: true,
            code: "all_verifications_failed",
          },
        },
      },
    });

    const records = await pool.query(
      "SELECT a.environment, count(n.id)::int AS count FROM action_v4 a LEFT JOIN nullifier_v4 n ON n.action_v4_id = a.id WHERE a.rp_id = $1 AND a.action = 'signup' GROUP BY a.environment",
      [rpId],
    );
    expect(records.rows).toEqual([{ environment: "staging", count: 1 }]);
  }, 30_000);
});
