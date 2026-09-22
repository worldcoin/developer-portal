// The CLI test child must never contact AWS or a public RPC, even on misconfiguration.
const http = require("node:http");
const https = require("node:https");
function assertLocal(input) {
  const host =
    typeof input === "string" || input instanceof URL
      ? new URL(input).hostname
      : (input.hostname || input.host || "localhost").split(":")[0];
  if (!["127.0.0.1", "localhost"].includes(host)) {
    throw new Error(`CLI test blocked non-loopback network request: ${host}`);
  }
}
for (const transport of [http, https]) {
  const request = transport.request;
  transport.request = function (input, ...args) {
    assertLocal(input);
    return request.call(this, input, ...args);
  };
  transport.get = function (...args) {
    const req = transport.request(...args);
    req.end();
    return req;
  };
}
const fetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  assertLocal(input instanceof Request ? input.url : input);
  return fetch(input, init);
};
