// Empty stub aliased in for `fs` in the browser bundle (see `turbopack.resolveAlias`
// in next.config.mjs). winston (server-only) pulls `fs` into the client graph; this
// keeps Turbopack from trying to bundle the Node built-in for the browser.
export default {};
