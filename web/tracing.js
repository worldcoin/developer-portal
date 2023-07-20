const tracer = require("dd-trace").init();

tracer.use("next");
