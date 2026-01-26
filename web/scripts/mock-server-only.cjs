// Mock "server-only" package for scripts that import server modules
// Usage: npx tsx --require ./web/scripts/mock-server-only.cjs web/scripts/e2e-rp-registration.ts

require.cache[require.resolve("server-only")] = {
  id: "server-only",
  filename: "server-only",
  loaded: true,
  exports: {},
};
