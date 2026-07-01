// Regression tests for the permission-layer id validation guard.
//
// Two related bugs let malformed/empty ids reach the GraphQL backend:
//   1. `getIsIdValid` validated against a schema that is NOT `.required()`,
//      so `validate(undefined)` resolved successfully and the function
//      returned `true` for a missing id — producing Hasura "expecting a value
//      for non-nullable variable" errors.
//   2. Most callers invoked `getIsIdValid(...)` WITHOUT `await`, so the guard
//      (a Promise, always truthy) never actually rejected anything.
//
// These tests assert that an invalid id is rejected in the handler itself,
// BEFORE the GraphQL client is ever constructed.

// #region Mocks
const getSessionMock = jest.fn();
jest.mock("@/lib/auth0", () => ({
  auth0: { getSession: (...args: unknown[]) => getSessionMock(...args) },
}));

// I/O boundary: if a guard fails to short-circuit, the handler reaches this.
// We assert it is NOT called for invalid ids.
const getAPIServiceGraphqlClient = jest.fn();
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: (...args: unknown[]) =>
    getAPIServiceGraphqlClient(...args),
}));

import {
  getIsUserAllowedToInsertApp,
  getIsUserAllowedToUpdateApp,
} from "@/lib/permissions";
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  // A valid session is present, so the ONLY thing that can reject these calls
  // is the id-format guard under test (not a missing session).
  getSessionMock.mockResolvedValue({ user: { hasura: { id: "usr_123" } } });
});

// #region invalid id is rejected before any GraphQL call
describe("permission guards reject invalid ids before hitting GraphQL", () => {
  it.each([
    ["empty string", ""],
    ["undefined", undefined as unknown as string],
    ["malformed id", "not-a-valid-id"],
  ])(
    "getIsUserAllowedToInsertApp returns false for %s without calling the client",
    async (_label, teamId) => {
      const result = await getIsUserAllowedToInsertApp(teamId);
      expect(result).toBe(false);
      expect(getAPIServiceGraphqlClient).not.toHaveBeenCalled();
    },
  );

  // This handler previously called `getIsIdValid` without `await`, so the
  // guard never fired. It must now reject an invalid id too.
  it.each([
    ["empty string", ""],
    ["undefined", undefined as unknown as string],
    ["malformed id", "not-a-valid-id"],
  ])(
    "getIsUserAllowedToUpdateApp returns false for %s without calling the client",
    async (_label, appId) => {
      const result = await getIsUserAllowedToUpdateApp(appId);
      expect(result).toBe(false);
      expect(getAPIServiceGraphqlClient).not.toHaveBeenCalled();
    },
  );
});
// #endregion
