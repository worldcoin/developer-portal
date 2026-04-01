# Developer Portal

## Project structure

- `web/` — Next.js app (API routes, frontend scenes, GraphQL)
- `web/api/` — Backend API route handlers (v1, v2, v4, hasura actions)
- `web/scenes/` — Frontend page components
- `web/tests/` — Jest unit tests
- `tests/` — Integration tests (require running services)
- `hasura/` — Hasura metadata and migrations

## Commands

- `cd web && pnpm generate:graphql-types` — Regenerate GraphQL types after editing `.graphql` files
- `cd web && npx tsc --noEmit` — Type check
- `cd web && npx jest <path>` — Run specific test file
- `cd web && npx jest --no-cache` — Run all tests
- `cd web && pnpm format:check` — Check code formatting

## Making Changes
Always run formatting and type checks before committing. Make sure tests pass as well.

## Testing

Tests live in `web/tests/api/` mirroring the `web/api/` directory structure.

### What to test

Test **branching logic in handlers** — the if/else decisions, state transitions, and edge cases. These are the things that break. Don't write tests that just confirm a mock returns what you told it to return.

### What to mock

Mock at the **I/O boundary only**: GraphQL SDK calls, external RPC, Redis, third-party services. The handler logic itself must be real — that's the thing under test.

```typescript
// Good: mock the generated GraphQL SDK
const GetRpRegistration = jest.fn();
jest.mock("../../../api/v4/rp-status/[rp_id]/graphql/get-rp-registration.generated", () => ({
  getSdk: () => ({ GetRpRegistration }),
}));

// Good: mock external RPC
jest.mock("../../../api/helpers/temporal-rpc", () => ({
  getRpFromContract: (...args: unknown[]) => getRpFromContractMock(...args),
}));

// Always mock the logger
jest.mock("../../../lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// Always mock the GraphQL client factory
jest.mock("../../../api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));
```

### Test structure conventions

Follow the `#region` pattern used in existing tests:

```typescript
import { POST } from "@/api/v2/some-endpoint";
import { NextRequest } from "next/server";

// #region Mocks
// ... jest.mock() calls and mock function declarations
// #endregion

// #region Test Data
// ... constants, helpers like createMockRequest, makeDbRecord
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  // set env vars, flush redis
});

// #region Description of what's being tested
describe("/api/v2/some-endpoint [success cases]", () => {
  it("does the expected thing", async () => {
    // arrange: set mock return values
    // act: call the handler
    // assert: check response status, body, and mock calls
  });
});
// #endregion
```

### Patterns to follow

- Import the handler directly (`import { GET } from "@/api/v4/..."`) and call it with `NextRequest` + context params
- Use `jest.fn()` for GraphQL SDK functions, configure with `.mockResolvedValue()` per test
- Use `mockImplementation` when different calls to the same mock need different responses (e.g., production vs staging contract)
- Assert on response `.status` and `.json()` body
- Assert that mutations were called (or not called) with expected args
- Use `makeDbRecord()` or similar helpers with sensible defaults and overrides
- IDs must match real validation (e.g., `rp_` + 16 hex chars, `app_` + 32 hex chars)
- Env vars go in `beforeEach`, not at module scope
- Redis is available via `global.RedisClient` (ioredis-mock from jest.setup.ts)

### What makes a test worth keeping

Each test should exercise a **distinct code path** through the handler. If two tests only differ in input values but hit the same branches, one is redundant. Good test suites cover:

- The happy path
- Each meaningful branch/guard condition (both sides of boundary)
- Error paths that produce different user-facing behavior
