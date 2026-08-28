import { spawn } from "node:child_process";
import { createServer } from "node:http";
import path from "node:path";

test("requires two consecutive successful GraphQL schema probes", async () => {
  const graphqlStatuses = [200, 503, 200, 200];
  const graphqlRequests: Array<{
    adminSecret: string | undefined;
    body: string;
  }> = [];
  const server = createServer((request, response) => {
    if (request.url === "/healthz") {
      response.writeHead(200).end("OK");
      return;
    }

    if (request.url !== "/v1/graphql") {
      response.writeHead(404).end();
      return;
    }

    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      graphqlRequests.push({
        adminSecret: request.headers["x-hasura-admin-secret"] as
          | string
          | undefined,
        body,
      });
      const status = graphqlStatuses[graphqlRequests.length - 1] ?? 200;
      if (status === 200) {
        response
          .writeHead(200, { "content-type": "application/json" })
          .end(JSON.stringify({ data: { __typename: "query_root" } }));
        return;
      }
      response.writeHead(status).end("not ready");
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Test server did not expose a TCP port.");
  }
  const origin = `http://127.0.0.1:${address.port}`;

  try {
    const child = spawn(
      process.execPath,
      [path.resolve(__dirname, "../../tests/verifyHasuraIsUp.js")],
      {
        env: {
          ...process.env,
          HASURA_GRAPHQL_ADMIN_SECRET: "test-secret",
          HASURA_TEST_PORT: "",
          HASURA_TEST_HEALTH_URL: `${origin}/healthz`,
          HASURA_TEST_MAX_WAIT_MS: "1000",
          HASURA_TEST_POLL_INTERVAL_MS: "10",
          NEXT_PUBLIC_GRAPHQL_API_URL: `${origin}/v1/graphql`,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    const exitCode = await new Promise<number | null>((resolve, reject) => {
      child.once("error", reject);
      child.once("close", resolve);
    });

    expect({ exitCode, stderr }).toEqual({ exitCode: 0, stderr: "" });
    expect(graphqlRequests).toHaveLength(4);
    expect(graphqlRequests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ adminSecret: "test-secret" }),
      ]),
    );
    expect(
      graphqlRequests.every(({ body }) => body.includes("__typename")),
    ).toBe(true);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("fails within the configured deadline when a probe never responds", async () => {
  const server = createServer(() => {
    // Deliberately accept the request without sending headers or a body.
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Test server did not expose a TCP port.");
  }
  const origin = `http://127.0.0.1:${address.port}`;

  try {
    const child = spawn(
      process.execPath,
      [path.resolve(__dirname, "../../tests/verifyHasuraIsUp.js")],
      {
        env: {
          ...process.env,
          HASURA_TEST_HEALTH_URL: `${origin}/healthz`,
          HASURA_TEST_MAX_WAIT_MS: "100",
          HASURA_TEST_POLL_INTERVAL_MS: "10",
          HASURA_TEST_PORT: "",
          NEXT_PUBLIC_GRAPHQL_API_URL: `${origin}/v1/graphql`,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    let safetyTimer: NodeJS.Timeout | undefined;
    const result = await Promise.race([
      new Promise<{ exitCode: number | null; timedOut: false }>(
        (resolve, reject) => {
          child.once("error", reject);
          child.once("close", (exitCode) =>
            resolve({ exitCode, timedOut: false }),
          );
        },
      ),
      new Promise<{ exitCode: null; timedOut: true }>((resolve) => {
        safetyTimer = setTimeout(() => {
          child.kill("SIGTERM");
          resolve({ exitCode: null, timedOut: true });
        }, 1_000);
      }),
    ]);
    if (safetyTimer) {
      clearTimeout(safetyTimer);
    }

    expect(result).toEqual({ exitCode: 1, timedOut: false });
    expect(stderr).toContain("within 100ms");
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
