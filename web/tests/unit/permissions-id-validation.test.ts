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

const GetIsUserPermittedToReadApp = jest.fn();
jest.mock(
  "@/lib/permissions/graphql/server/get-app-read-permissions.generated",
  () => ({
    getSdk: () => ({ GetIsUserPermittedToReadApp }),
  }),
);

import {
  getIsUserAllowedToInsertApp,
  getIsUserAllowedToReadApp,
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

// #region compound-prefix entity ids are accepted
describe("permission guards accept generated ids with compound prefixes", () => {
  it("getIsUserAllowedToReadApp accepts staging app ids and checks GraphQL", async () => {
    const stagingAppId = "app_staging_6b1925816f364fbb27284a44c01bf5c9";
    getAPIServiceGraphqlClient.mockResolvedValue({});
    GetIsUserPermittedToReadApp.mockResolvedValue({
      app_by_pk: {
        team: {
          memberships: [{ user_id: "usr_123", role: "OWNER" }],
        },
      },
    });

    const result = await getIsUserAllowedToReadApp(stagingAppId);

    expect(result).toBe(true);
    expect(GetIsUserPermittedToReadApp).toHaveBeenCalledWith({
      appId: stagingAppId,
      userId: "usr_123",
    });
  });
});
// #endregion
