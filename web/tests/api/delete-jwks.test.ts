import { createMocks } from "node-mocks-http";
import handleDeleteJWKS from "src/pages/api/_delete-jwks";
import { when } from "jest-when";

let consoleInfoSpy: jest.SpyInstance;
const requestReturnFn = jest.fn();
const mutateReturnFn = jest.fn();

jest.mock(
  "src/backend/graphql",
  jest.fn(() => ({
    getAPIServiceClient: () => ({
      query: requestReturnFn,
      mutate: mutateReturnFn,
    }),
  }))
);

jest.mock("src/backend/kms", () => require("tests/api/__mocks__/kms.mock.ts"));

beforeEach(() => {
  consoleInfoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  consoleInfoSpy.mockRestore();
  mutateReturnFn.mockClear();
});

describe("/api/v1/_delete-jwks", () => {
  test("endpoint is only accessible with specific token (Hasura)", async () => {
    const { req, res } = createMocks({
      method: "POST",
    });

    await handleDeleteJWKS(req, res);

    expect(res._getStatusCode()).toBe(403);
    expect(res._getJSONData()).toEqual({
      code: "permission_denied",
      detail: "You do not have permission to perform this action.",
      attribute: null,
    });
  });

  test("will not delete jwks if none are expired", async () => {
    const { req, res } = createMocks({
      method: "POST",
      headers: {
        authorization: process.env.INTERNAL_ENDPOINTS_SECRET,
      },
    });

    when(mutateReturnFn)
      .calledWith(expect.anything())
      .mockResolvedValue({
        data: {
          delete_jwks: { returning: [], __typename: "jwks_mutation_response" },
        },
      });

    await handleDeleteJWKS(req, res);

    expect(res._getStatusCode()).toBe(204);
    expect(consoleInfoSpy).toHaveBeenCalledTimes(2);
    expect(consoleInfoSpy).toHaveBeenNthCalledWith(
      1,
      "Starting deletion of expired jwks."
    );
    expect(consoleInfoSpy).toHaveBeenNthCalledWith(
      2,
      "Deleted 0 expired jwks."
    );
  });

  test("will delete all jwks if past expiration date", async () => {
    const { req, res } = createMocks({
      method: "POST",
      headers: {
        authorization: process.env.INTERNAL_ENDPOINTS_SECRET,
      },
    });

    when(mutateReturnFn)
      .calledWith(expect.anything())
      .mockResolvedValue({
        data: {
          delete_jwks: {
            returning: [
              {
                id: "jwk_4b4e07011e4766c69062b90ff384afc4",
                kms_id: "f9f0ba3b-054b-4c27-bcc4-3c22c328117e",
                __typename: "jwks",
              },
            ],
            __typename: "jwks_mutation_response",
          },
        },
      });

    await handleDeleteJWKS(req, res);

    expect(res._getStatusCode()).toBe(204);
    expect(consoleInfoSpy).toHaveBeenCalledTimes(2);
    expect(consoleInfoSpy).toHaveBeenNthCalledWith(
      1,
      "Starting deletion of expired jwks."
    );
    expect(consoleInfoSpy).toHaveBeenNthCalledWith(
      2,
      "Deleted 1 expired jwks."
    );
  });
});
