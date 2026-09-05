import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Readable, Writable } from "node:stream";
import { Portal, Remote, serve } from "../scripts/portal.mjs";

test("stdio to HTTP lifecycle persists a returned key and exposes only its reference", async (t) => {
  const dataDir = await mkdtemp(join(tmpdir(), "world-transport-test-"));
  const tools = JSON.parse(
    await readFile(new URL("../contracts/portal-tools.json", import.meta.url)),
  );
  const signingKey = "0x" + "56".repeat(32);
  const requests = [];
  const server = createServer(async (req, res) => {
    let body = "";
    for await (const part of req) body += part;
    const message = JSON.parse(body);
    requests.push(message);
    if (message.id === undefined) {
      res.writeHead(202);
      res.end();
      return;
    }
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Mcp-Session-Id", "fixture-session");
    const result =
      message.method === "initialize"
        ? { protocolVersion: "2025-06-18" }
        : message.method === "tools/list"
          ? { tools }
          : {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    rp_id: "rp_0123456789abcdef",
                    signing_key: { private_key: signingKey },
                    status: "pending",
                  }),
                },
              ],
            };
    res.end(JSON.stringify({ jsonrpc: "2.0", id: message.id, result }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(
    () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(resolve);
      }),
  );
  const endpoint = `http://127.0.0.1:${server.address().port}/mcp`;
  const portal = new Portal({
    env: { WORLD_DEVELOPER_API_KEY: "api_fixture" },
    dataDir,
    remoteFactory: (key) => new Remote({ key, endpoint }),
  });
  let output = "";
  await serve(
    portal,
    Readable.from([
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "configure_world_id",
          arguments: { app_id: "app_0123456789abcdef0123456789abcdef" },
        },
      }) + "\n",
    ]),
    new Writable({
      write(chunk, _encoding, cb) {
        output += chunk;
        cb();
      },
    }),
  );
  assert.equal(output.includes(signingKey), false);
  const response = JSON.parse(output).result;
  assert.equal(response.isError, undefined);
  const { secret_file } = JSON.parse(response.content.at(-1).text);
  assert.equal(
    await readFile(secret_file, "utf8"),
    `WORLD_ID_SIGNING_KEY=${signingKey}\n`,
  );
  assert.deepEqual(
    requests.map((r) => r.method),
    ["initialize", "notifications/initialized", "tools/list", "tools/call"],
  );
});
