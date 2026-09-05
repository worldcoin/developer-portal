import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Portal, Remote, sanitizeTestData } from "../scripts/portal.mjs";

const contract = JSON.parse(
  await readFile(new URL("../contracts/portal-tools.json", import.meta.url)),
);
const key = "api_fixture";
const secret = `0x${"ab".repeat(32)}`;
const app = "app_0123456789abcdef0123456789abcdef";
function synthetic() {
  return {
    test: true,
    expires_at: "2030-01-01T00:00:00Z",
    verify_url: "https://developer.world.org/api/v4/verify/rp_0123456789abcdef",
    payload: {
      protocol_version: "4.0",
      environment: "staging",
      action: "claim",
      nonce: `0x00${"12".repeat(31)}`,
      responses: [
        {
          identifier: "proof_of_human",
          issuer_schema_id: 1,
          nullifier: `0x00${"34".repeat(31)}`,
          signal_hash: "0x0",
          expires_at_min: 1893456000,
          credential_genesis_issued_at_min: 0,
          proof: Array(5).fill(`0x${"0".repeat(64)}`),
        },
      ],
    },
  };
}
function fixture({ tools = contract, result = synthetic() } = {}) {
  const calls = [];
  const portal = new Portal({
    env: { WORLD_DEVELOPER_API_KEY: key },
    remoteFactory: () => ({
      key,
      initialize: async () => {},
      request: async (method, params) => {
        calls.push({ method, params });
        if (method === "tools/list") return { tools };
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                params.name === "run_test_verification"
                  ? result
                  : { team: { id: "fixture" } },
              ),
            },
          ],
        };
      },
    }),
  });
  return { portal, calls };
}

test("preserves every synthetic verifier input while redacting unrelated secrets", async () => {
  const result = synthetic();
  result.private_key = secret;
  result.debug = key;
  const { portal } = fixture({ result });
  const response = await portal.call("run_test_verification", {
    app_id: app,
    action: "claim",
    outcome: "success",
  });
  assert.equal(response.isError, undefined);
  const data = JSON.parse(response.content[0].text);
  assert.deepEqual(data.payload, result.payload);
  assert.equal(data.test, true);
  assert.equal(data.private_key, "[REDACTED]");
  assert.equal(data.debug, "[REDACTED]");
  assert.ok(!JSON.stringify(response).includes(secret));
});

test("older server stays connected and rejects only the unavailable optional tool", async () => {
  const { portal, calls } = fixture({
    tools: contract.filter((t) => t.name !== "run_test_verification"),
  });
  const status = JSON.parse((await portal.status()).content[0].text);
  assert.equal(status.status, "connected");
  assert.deepEqual(status.unavailable_optional_tools, [
    "run_test_verification",
  ]);
  const result = await portal.call("run_test_verification", {
    app_id: app,
    action: "claim",
  });
  assert.equal(JSON.parse(result.content[0].text).status, "unsupported_tool");
  assert.ok(!calls.some((c) => c.params?.name === "run_test_verification"));
  assert.equal(
    (await portal.call("get_app_config", { app_id: app })).isError,
    undefined,
  );
});

test("unsupported outcomes fail before any request reaches the server", async () => {
  const { portal, calls } = fixture();
  const result = await portal.call("run_test_verification", {
    app_id: app,
    action: "claim",
    outcome: "invalid_rp_signature",
  });
  assert.equal(JSON.parse(result.content[0].text).status, "invalid_arguments");
  assert.equal(calls.length, 0);
});

test("expected direct verification rejection remains a successful tool response", async () => {
  const result = synthetic();
  result.direct_result = {
    status: 400,
    body: { success: false, test: true, code: "all_verifications_failed" },
  };
  const { portal, calls } = fixture({ result });
  const response = await portal.call("run_test_verification", {
    app_id: app,
    action: "claim",
    direct: true,
    outcome: "expired",
  });
  assert.equal(response.isError, undefined);
  assert.deepEqual(
    JSON.parse(response.content[0].text).direct_result,
    result.direct_result,
  );
  assert.equal(calls.filter((c) => c.method === "tools/call").length, 1);
});

test("unknown direct outcome retains its payload and retry details without retrying", async () => {
  const data = {
    ...synthetic(),
    reason: "direct_timeout",
    verification_outcome: "unknown",
  };
  let calls = 0;
  const remote = new Remote({
    key,
    fetchImpl: async () => {
      calls++;
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          error: { code: -32603, message: "Direct outcome unknown", data },
        }),
      );
    },
  });
  await assert.rejects(
    () =>
      remote.request("tools/call", {
        name: "run_test_verification",
        arguments: { action: "claim" },
      }),
    (error) => {
      assert.equal(error.code, "remote_-32603");
      assert.deepEqual(error.details.payload, data.payload);
      assert.equal(error.details.verification_outcome, "unknown");
      return true;
    },
  );
  assert.equal(calls, 1);
});

test("a production, altered or secret-bearing payload never gets a redaction exemption", () => {
  for (const mutate of [
    (d) => {
      d.test = false;
    },
    (d) => {
      d.payload.environment = "production";
    },
    (d) => {
      d.payload.action = "other";
    },
    (d) => {
      d.payload.private_key = secret;
    },
    (d) => {
      d.payload.responses[0].proof[0] = secret;
    },
  ]) {
    const data = synthetic();
    mutate(data);
    assert.throws(() => sanitizeTestData(data, [key], "claim"), {
      code: "unexpected_test_payload",
    });
  }
});

test("a public action that resembles an API prefix is not silently changed", () => {
  const data = synthetic();
  data.payload.action = "api_example";
  assert.equal(
    sanitizeTestData(data, [key], "api_example").payload.action,
    "api_example",
  );
});
