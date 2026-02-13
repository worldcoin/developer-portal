import { POST } from "@/api/_delete-jwks";
import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";

let consoleInfoSpy: jest.SpyInstance;

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn(),
}));
const DeleteExpiredJWKs = jest.fn();
jest.mock("@/api/helpers/jwks/graphql/delete-expired-jwks.generated", () => ({
  getSdk: () => ({
    DeleteExpiredJWKs,
  }),
}));

beforeEach(() => {
  consoleInfoSpy = jest
    .spyOn(logger, "info")
    .mockImplementation(async () => {});
});

afterEach(() => {
  consoleInfoSpy.mockRestore();
});

describe("/api/v1/_delete-jwks", () => {
  test("endpoint is only accessible with specific token (Hasura)", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/v1/_delete-jwks",
      {
        method: "POST",
      },
    );

    const response = await POST(request);

    expect(response?.status).toBe(403);
    expect(await response?.json()).toEqual({
      code: "permission_denied",
      detail: "You do not have permission to perform this action.",
      attribute: null,
    });
  });

  test("will not delete jwks if none are expired", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/v1/_delete-jwks",
      {
        method: "POST",
        headers: {
          authorization: process.env.INTERNAL_ENDPOINTS_SECRET || "",
        },
      },
    );

    DeleteExpiredJWKs.mockResolvedValue({
      delete_jwks: { returning: [], __typename: "jwks_mutation_response" },
    });

    const response = await POST(request);

    expect(response?.status).toBe(204);
    expect(consoleInfoSpy).toHaveBeenCalledTimes(2);
    expect(consoleInfoSpy).toHaveBeenNthCalledWith(
      1,
      "Starting deletion of expired jwks.",
    );
    expect(consoleInfoSpy).toHaveBeenNthCalledWith(
      2,
      "Deleted 0 expired jwks.",
    );
  });

  test("will delete all jwks if past expiration date", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/v1/_delete-jwks",
      {
        method: "POST",
        headers: {
          authorization: process.env.INTERNAL_ENDPOINTS_SECRET || "",
        },
      },
    );

    DeleteExpiredJWKs.mockResolvedValue({
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
    });

    const response = await POST(request);

    expect(response?.status).toBe(204);
    expect(consoleInfoSpy).toHaveBeenCalledTimes(2);
    expect(consoleInfoSpy).toHaveBeenNthCalledWith(
      1,
      "Starting deletion of expired jwks.",
    );
    expect(consoleInfoSpy).toHaveBeenNthCalledWith(
      2,
      "Deleted 1 expired jwks.",
    );
  });
});
