const tracer = require("dd-trace").init();

tracer.use("next", {
  hooks: {
    request: (span, req, res) => {
      // FIXME: remove after testing
      console.log("request hook called");
    },
  },
});
