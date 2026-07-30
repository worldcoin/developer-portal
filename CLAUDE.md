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

## Feature flags

All feature flags are exposed through the single `featureFlags` object in `web/lib/feature-flags/index.ts`, accessed as `featureFlags.<featureName>.<accessor>()` (e.g. `featureFlags.portalV3.isEnabled()`). New flags register a namespace there; call sites must import `featureFlags` rather than individual flag modules.

Pros: every flag in the system is discoverable from one import via autocomplete. Each decision's source is obvious at the call site from the `featureFlags.` prefix. Resolution backends (env, hardcoded lists, a future vendor provider) can change without touching call sites.

## Making Changes

Always run formatting and type checks before committing. Make sure tests pass as well.

Never commit or push to a branch other than the one currently being worked on — especially a branch with its own open pull request — without asking first. Propose the change and wait for explicit approval.

## Icons and glyph optical centering (required check when adding icons or badges)

Any change that adds an icon, a numbered/lettered bubble, or a glyph beside a
text label MUST be checked for optical centering — geometric centering is not
enough, because flex centers the text's **line box**, not the glyph, and the
World Pro font reserves descender space that digits/caps don't use:

- **Icon beside cap-height text** → wrap it with `opticalIconClassName`
  (exported from `web/scenes/PortalV3/common/Icon`); otherwise it reads ~1px low.
- **Digit/cap glyph inside a fixed circle or pill** (stepper dots, count
  badges) → wrap the glyph with `bubbleDigitClassName` from the same file;
  otherwise it paints ~2.75px high at text-13. The class applies 0.12em, an
  optical value chosen by eye — exact ink-centering (0.21em) reads too low.
- Verify with `cd web && node scripts/check-optical-centering.mjs` — it
  renders the bubble recipe with the real font and fails if the corrected
  glyph drifts more than 0.15px from the circle's center. Run it whenever you
  touch bubble markup, the correction offsets, or `WorldProMVP.ttf`.
- Zoomed screenshots are the manual fallback: capture the element at 4x+ and
  compare the ink's top/bottom gaps before calling the UI done.

## Pull request follow-up

After pushing a branch with an open pull request, wait 5 minutes, then check the
pull request for review comments and requested changes. If comments require code
changes, make the fixes, rerun the relevant checks, commit, and push the branch
again.

## Testing

Tests live in `web/tests/api/` mirroring the `web/api/` directory structure.

### What to test

Test **branching logic in handlers** — the if/else decisions, state transitions, and edge cases. These are the things that break. Don't write tests that just confirm a mock returns what you told it to return.

### What to mock

Mock at the **I/O boundary only**: GraphQL SDK calls, external RPC, Redis, third-party services. The handler logic itself must be real — that's the thing under test.

```typescript
// Good: mock the generated GraphQL SDK
const GetRpRegistration = jest.fn();
jest.mock(
  "../../../api/v4/rp-status/[rp_id]/graphql/get-rp-registration.generated",
  () => ({
    getSdk: () => ({ GetRpRegistration }),
  }),
);

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
