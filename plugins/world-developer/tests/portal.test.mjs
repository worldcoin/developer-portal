import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  readFile,
  writeFile,
  chmod,
  stat,
  mkdir,
  symlink,
  readdir,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable, Writable } from "node:stream";
import {
  Portal,
  Remote,
  PortalError,
  credential,
  redact,
  serve,
} from "../scripts/portal.mjs";

const contract = JSON.parse(
  await readFile(new URL("../contracts/portal-tools.json", import.meta.url)),
);
const key = "api_fixture_key";
const signingKey = "0x" + "12".repeat(32);
const app = "app_0123456789abcdef0123456789abcdef";
const decode = (result) => JSON.parse(result.content[0].text);
const message = (data) => ({
  content: [{ type: "text", text: JSON.stringify(data) }],
});

async function fixture(overrides = {}) {
  const dataDir = await mkdtemp(join(tmpdir(), "world-portal-test-"));
  const calls = [];
  const remote = {
    key,
    initialize: async () => {},
    request: async (method, params) => {
      calls.push({ method, params });
      if (method === "tools/list")
        return { tools: overrides.tools || contract };
      return (
        overrides.result ||
        message({
          app_id: app,
          signing_key: {
            private_key: signingKey,
            address: "0x" + "ab".repeat(20),
          },
        })
      );
    },
  };
  if (overrides.request)
    remote.request = async (...args) => {
      calls.push(args);
      return overrides.request(...args);
    };
  const portal = new Portal({
    env: { WORLD_DEVELOPER_API_KEY: key },
    dataDir,
    remoteFactory: () => remote,
  });
  return { portal, dataDir, calls };
}

test("MCP initialization and tool discovery succeed offline without credentials", async () => {
  const { dataDir } = await fixture();
  let network = 0;
  const portal = new Portal({
    env: {},
    dataDir,
    remoteFactory: () => {
      network++;
      throw new Error();
    },
  });
  let text = "";
  const sink = new Writable({
    write(chunk, _encoding, cb) {
      text += chunk;
      cb();
    },
  });
  await serve(
    portal,
    Readable.from([
      '{"jsonrpc":"2.0","id":1,"method":"initialize"}\n',
      '{"jsonrpc":"2.0","method":"notifications/initialized"}\n',
      '{"jsonrpc":"2.0","id":2,"method":"tools/list"}\n',
      '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"portal_connection_status"}}\n',
    ]),
    sink,
  );
  const responses = text.trim().split("\n").map(JSON.parse);
  assert.equal(responses.length, 3);
  assert.equal(responses[0].result.serverInfo.name, "world-portal");
  assert.equal(responses[1].result.tools.length, contract.length + 1);
  assert.equal(decode(responses[2].result).status, "missing_credentials");
  assert.equal(network, 0);
});

test("saved credentials are read afresh without a host restart", async () => {
  const { dataDir } = await fixture();
  await assert.rejects(() => credential({}, dataDir), {
    code: "missing_credentials",
  });
  await writeFile(join(dataDir, "api-key"), key, { mode: 0o600 });
  assert.equal(await credential({}, dataDir), key);
});

test("invalid environment credential never falls back to another saved team", async () => {
  const { dataDir } = await fixture();
  await writeFile(join(dataDir, "api-key"), key, { mode: 0o600 });
  await assert.rejects(
    () => credential({ WORLD_DEVELOPER_API_KEY: "invalid" }, dataDir),
    { code: "invalid_credentials" },
  );
});

test("readable-by-others and symlink credential files are rejected", async () => {
  const { dataDir } = await fixture();
  await writeFile(join(dataDir, "api-key"), key, { mode: 0o644 });
  await assert.rejects(() => credential({}, dataDir), {
    code: "unsafe_credentials",
  });
  const other = await mkdtemp(join(tmpdir(), "world-credential-test-"));
  await symlink(join(dataDir, "api-key"), join(other, "api-key"));
  await assert.rejects(() => credential({}, other), {
    code: "unsafe_credentials",
  });
});

test("connection status checks team without leaking team data", async () => {
  const { portal, calls } = await fixture({
    result: message({ team_id: "private-team", apps: [{ id: app }] }),
  });
  const result = await portal.status();
  assert.equal(decode(result).status, "connected");
  assert.equal(JSON.stringify(result).includes("private-team"), false);
  assert.deepEqual(
    calls.map((c) => c.method),
    ["tools/list", "tools/call"],
  );
});

test("connection distinguishes an authenticated schema mismatch", async () => {
  const { portal } = await fixture({ tools: [] });
  const result = decode(await portal.status());
  assert.equal(result.status, "schema_drift");
  assert.equal(result.authenticated_team_check, true);
});

test("schema drift prevents writes before they happen", async () => {
  const { portal, calls } = await fixture({ tools: [] });
  assert.equal(
    decode(await portal.call("create_app", { name: "Example" })).status,
    "schema_drift",
  );
  assert.equal(
    calls.some((c) => c.method === "tools/call"),
    false,
  );
});

test("read-only signer lookup cannot trigger the upstream rotation option", async () => {
  const { portal, calls } = await fixture();
  const result = await portal.call("get_world_id_signing_key", {
    app_id: app,
    rotate_if_unavailable: true,
  });
  assert.equal(decode(result).status, "invalid_arguments");
  assert.equal(calls.length, 0);
});

test("private keys cannot enter the adapter through tool arguments", async () => {
  const { portal, calls } = await fixture();
  const result = await portal.call("configure_world_id", {
    app_id: app,
    signer_private_key: signingKey,
  });
  assert.equal(decode(result).status, "invalid_arguments");
  assert.equal(calls.length, 0);
  assert.equal(JSON.stringify(result).includes(signingKey), false);
});

test("invalid nested array values and unsupported staging creation are rejected", async () => {
  const { portal, calls } = await fixture();
  assert.equal(
    decode(
      await portal.call("configure_mini_app", {
        app_id: app,
        contracts: [123],
      }),
    ).status,
    "invalid_arguments",
  );
  assert.equal(
    decode(
      await portal.call("create_app", { name: "Example", build: "staging" }),
    ).status,
    "invalid_arguments",
  );
  assert.equal(calls.length, 0);
});

test("review preparation cannot submit with a false confirmation", async () => {
  const { portal, calls } = await fixture();
  assert.equal(
    decode(
      await portal.call("submit_app_for_review", {
        app_id: app,
        confirm_submission: false,
      }),
    ).status,
    "submission_not_confirmed",
  );
  assert.equal(calls.length, 0);
});

test("ordinary authorized configuration forwards only the supplied fields", async () => {
  const { portal, calls } = await fixture({
    result: message({ updated: true }),
  });
  const args = { app_id: app, supported_languages: ["en"] };
  assert.equal(
    decode(await portal.call("configure_mini_app", args)).updated,
    true,
  );
  assert.deepEqual(calls.at(-1).params.arguments, args);
});

test("generated signing key is persisted privately and removed from all output", async () => {
  const result = message({
    signing_key: { private_key: signingKey },
    repeated: signingKey,
    operation_hash: "0x" + "34".repeat(32),
  });
  result.structuredContent = { private_key: signingKey };
  const { portal, dataDir } = await fixture({ result });
  const response = await portal.call("configure_world_id", { app_id: app });
  assert.equal(response.isError, undefined);
  assert.equal(JSON.stringify(response).includes(signingKey), false);
  assert.equal(decode(response).operation_hash, "0x" + "34".repeat(32));
  const ref = JSON.parse(response.content.at(-1).text);
  assert.equal(
    await readFile(ref.secret_file, "utf8"),
    `WORLD_ID_SIGNING_KEY=${signingKey}\n`,
  );
  assert.equal((await stat(ref.secret_file)).mode & 0o777, 0o600);
  assert.equal((await stat(join(dataDir, "secrets"))).mode & 0o777, 0o700);
});

test("unsafe storage fails before any secret-producing request", async () => {
  const { portal, dataDir, calls } = await fixture();
  await chmod(dataDir, 0o755);
  const response = await portal.call("configure_world_id", { app_id: app });
  assert.equal(decode(response).status, "unsafe_storage");
  assert.equal(
    calls.some((c) => c.method === "tools/call"),
    false,
  );
});

test("an interrupted signing operation preserves its reservation and is never retried", async () => {
  let writes = 0;
  const { portal, dataDir } = await fixture({
    request: async (method) => {
      if (method === "tools/list") return { tools: contract };
      writes++;
      throw new PortalError("transport_error", "timeout");
    },
  });
  const response = await portal.call("rotate_world_id_signing_key", {
    app_id: app,
  });
  assert.equal(decode(response).status, "key_operation_uncertain");
  assert.equal(writes, 1);
  const files = await readdir(join(dataDir, "secrets"));
  assert.equal(files.length, 1);
  assert.match(
    await readFile(join(dataDir, "secrets", files[0]), "utf8"),
    /^# Pending/,
  );
});

test("unknown response key is redacted even outside a secret-producing tool", async () => {
  const { portal } = await fixture({
    result: message({
      unexpected: signingKey,
      private_key: signingKey,
      text: key,
    }),
  });
  const response = await portal.call("get_app_config", { app_id: app });
  assert.equal(JSON.stringify(response).includes(signingKey), false);
  assert.equal(JSON.stringify(response).includes(key), false);
});

test("upstream private key errors are sanitized", async () => {
  const remote = new Remote({
    key,
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          error: { code: -32602, message: `Rejected ${key} ${signingKey}` },
        }),
      ),
  });
  await assert.rejects(
    () => remote.request("tools/call"),
    (error) =>
      !error.message.includes(key) && !error.message.includes(signingKey),
  );
});

test("HTTP and JSON-RPC authentication failures have the same specific status", async () => {
  for (const response of [
    new Response("", { status: 401 }),
    new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        error: { code: -32001, message: "bad key" },
      }),
    ),
  ]) {
    const remote = new Remote({ key, fetchImpl: async () => response });
    await assert.rejects(() => remote.request("initialize"), {
      code: "rejected_credentials",
    });
  }
});

test("transport failure is distinguished from server failure, without retrying", async () => {
  let attempts = 0;
  const remote = new Remote({
    key,
    fetchImpl: async () => {
      attempts++;
      throw new Error("sensitive network details");
    },
  });
  await assert.rejects(() => remote.request("tools/call"), {
    code: "transport_error",
  });
  assert.equal(attempts, 1);
  await assert.rejects(
    () =>
      new Remote({
        key,
        fetchImpl: async () => new Response("", { status: 503 }),
      }).request("ping"),
    { code: "server_error" },
  );
});

test("SSE response is parsed and request identity checked", async () => {
  const remote = new Remote({
    key,
    fetchImpl: async () =>
      new Response(
        'event: message\r\ndata: {"jsonrpc":"2.0","id":1,"result":{"ok":true}}\r\n\r\n',
        { headers: { "content-type": "text/event-stream" } },
      ),
  });
  assert.deepEqual(await remote.request("ping"), { ok: true });
  const mismatched = new Remote({
    key,
    fetchImpl: async () =>
      new Response('{"jsonrpc":"2.0","id":99,"result":{}}'),
  });
  await assert.rejects(() => mismatched.request("ping"), {
    code: "invalid_response",
  });
});

test("HTTP transport refuses redirects and propagates negotiated session ID", async () => {
  const options = [];
  const remote = new Remote({
    key,
    fetchImpl: async (_url, request) => {
      options.push(request);
      const incoming = JSON.parse(request.body);
      if (incoming.id === undefined) return new Response(null, { status: 202 });
      return new Response(
        JSON.stringify({ jsonrpc: "2.0", id: incoming.id, result: {} }),
        { headers: { "mcp-session-id": "session-test" } },
      );
    },
  });
  await remote.initialize();
  await remote.request("tools/list");
  assert.equal(options[0].redirect, "error");
  assert.equal(JSON.parse(options[1].body).method, "notifications/initialized");
  assert.equal(options[2].headers["Mcp-Session-Id"], "session-test");
});

test("malformed stdio input yields a protocol error and the server continues", async () => {
  let output = "";
  const sink = new Writable({
    write(chunk, _encoding, cb) {
      output += chunk;
      cb();
    },
  });
  await serve(
    new Portal(),
    Readable.from([
      'garbage\nnull\n{"jsonrpc":"2.0","id":4,"method":"ping"}\n',
    ]),
    sink,
  );
  const result = output.trim().split("\n").map(JSON.parse);
  assert.equal(result[0].error.code, -32700);
  assert.equal(result[1].error.code, -32600);
  assert.deepEqual(result[2].result, {});
});
