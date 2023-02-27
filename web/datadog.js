const ddTrace = require("dd-trace");

/** @type {import('dd-trace').Tracer} */
const tracer = ddTrace.init({});
tracer.use("http", {
  blocklist: ["/api/health"],
});

module.exports = tracer;
