import fetchMock from "jest-fetch-mock";
import { fetchActiveJWK, generateJWK, retrieveJWK } from "src/backend/jwks";
import {
  createKMSKey,
  getKMSClient,
  scheduleKeyDeletion,
} from "src/backend/kms";
import {
  integrationDBExecuteQuery,
  integrationDBSetup,
  integrationDBTearDown,
} from "./setup";

jest.mock("src/backend/kms", () => {
  return {
    getKMSClient: jest.fn(),
    createKMSKey: jest.fn(),
    scheduleKeyDeletion: jest.fn(),
  };
});

beforeAll(() => {
  fetchMock.enableMocks();
  fetchMock.dontMock(); // Don't override graphql calls, just fetch
});

// TODO: Consider moving this to a generalized jest environment
beforeEach(integrationDBSetup);
beforeEach(integrationDBTearDown);

describe("jwks management", () => {
  it("can retrieve existing jwks", async () => {
    const { rows } = await integrationDBExecuteQuery(
      'SELECT * FROM "public"."jwks" WHERE "alg" = \'RS256\' LIMIT 1;'
    );

    const jwk = await retrieveJWK(rows[0].id);
    expect(jwk.kid).toEqual(rows[0].id);
  });

  it("throws error if the jwk is not found", async () => {
    await expect(retrieveJWK("non-existing-jwk")).rejects.toThrowError(
      "JWK not found."
    );
  });

  it("fetches an active jwk", async () => {
    const { rows } = await integrationDBExecuteQuery(
      'SELECT * FROM "public"."jwks" WHERE "alg" = \'RS256\' LIMIT 1;'
    );

    const jwk = await fetchActiveJWK();
    expect(jwk.kid).toEqual(rows[0].id);
  });

  it("does not rotate a jwk with more than 7 days to expire", async () => {
    const { rows } = await integrationDBExecuteQuery(
      'SELECT * FROM "public"."jwks" WHERE "expires_at" > NOW() + INTERVAL \'7 days\' LIMIT 1;'
    );

    const jwk = await fetchActiveJWK();
    expect(jwk.kid).toEqual(rows[0].id);
  });

  it("rotates a jwk with less than 7 days to expire", async () => {
    const { rows } = await integrationDBExecuteQuery(
      'UPDATE "public"."jwks" SET "expires_at" = NOW() + INTERVAL \'6 days\' WHERE "id" = (SELECT id FROM "public"."jwks" WHERE "alg" = \'RS256\' LIMIT 1) RETURNING "id";'
    );

    // Mock the response for /api/_gen-jwk
    fetchMock.mockIf(/localhost:3000/).mockResponse(
      JSON.stringify({
        success: true,
        jwk: {
          id: "jwk_b242fe80572fe7bd60f8aea73627454a",
          kms_id: "818267d0-80ea-4f40-9540-dd83d0b76bb7",
          expires_at: "2023-04-17T18:01:12.449+00:00",
          __typename: "jwks",
        },
      })
    );

    const jwk = await fetchActiveJWK();
    expect(jwk.kid).not.toEqual(rows[0].id);
  });

  it("throws error if a new jwk is not created", async () => {
    const { rows } = await integrationDBExecuteQuery(
      'UPDATE "public"."jwks" SET "expires_at" = NOW() + INTERVAL \'6 days\' WHERE "id" = (SELECT id FROM "public"."jwks" WHERE "alg" = \'RS256\' LIMIT 1) RETURNING "id";'
    );

    // Mock the response for /api/_gen-jwk
    fetchMock.mockIf(/localhost:3000/).mockResponse(
      JSON.stringify({
        code: "jwk_generation_failed",
        detail: "Failed to generate JWK.",
      }),
      { status: 500 }
    );

    await expect(fetchActiveJWK()).rejects.toThrowError(
      "Unable to rotate JWK."
    );
  });

  it("does not delete jwks that are within expiration window", async () => {
    const { rows } = await integrationDBExecuteQuery(
      'UPDATE "public"."jwks" SET "expires_at" = NOW() - INTERVAL \'10 minutes\' WHERE "id" = (SELECT id FROM "public"."jwks" WHERE "alg" = \'RS256\' LIMIT 1) RETURNING "id";'
    );

    // Mock the response for /api/_gen-jwk
    fetchMock.mockIf(/localhost:3000/).mockResponse(
      JSON.stringify({
        success: true,
        jwk: {
          id: "jwk_b242fe80572fe7bd60f8aea73627454a",
          kms_id: "818267d0-80ea-4f40-9540-dd83d0b76bb7",
          expires_at: "2023-04-17T18:01:12.449+00:00",
          __typename: "jwks",
        },
      })
    );

    await fetchActiveJWK();

    const { rows: rowsAfter } = await integrationDBExecuteQuery(
      'SELECT "id" FROM "public"."jwks" WHERE "alg" = \'RS256\''
    );
    expect(rowsAfter.length).toEqual(rows.length);
  });

  it("deletes jwks that are outside expiration window", async () => {
    const { rows } = await integrationDBExecuteQuery(
      'UPDATE "public"."jwks" SET "expires_at" = NOW() - INTERVAL \'30 minutes\' WHERE "id" = (SELECT id FROM "public"."jwks" WHERE "alg" = \'RS256\' LIMIT 1) RETURNING "id";'
    );

    // Mock the response for /api/_gen-jwk
    fetchMock.mockIf(/localhost:3000/).mockResponse(
      JSON.stringify({
        success: true,
        jwk: {
          id: "jwk_b242fe80572fe7bd60f8aea73627454a",
          kms_id: "818267d0-80ea-4f40-9540-dd83d0b76bb7",
          expires_at: "2023-04-17T18:01:12.449+00:00",
          __typename: "jwks",
        },
      })
    );

    // Mock the responses for KMS functions
    (getKMSClient as jest.Mock).mockReturnValue(true);
    (scheduleKeyDeletion as jest.Mock).mockReturnValue(true);

    await fetchActiveJWK();

    const { rows: rowsAfter } = await integrationDBExecuteQuery(
      'SELECT "id" FROM "public"."jwks" WHERE "alg" = \'RS256\''
    );
    expect(rowsAfter.length).not.toEqual(rows.length);
  });

  it("can generate new kms keys", async () => {
    // Mock the responses for KMS functions
    (getKMSClient as jest.Mock).mockReturnValue(true);
    (createKMSKey as jest.Mock).mockReturnValue({
      keyId: "da112a8b-023d-4eda-ae7d-33fde0a721b4",
      publicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvzV3R48ve50etEd4BtryHzo1x1h1tC1poHkSXGzjXPIXmYvuLyZPCWfNzuH9YpXfuZRch1p3YrFRavSoQClb/kfAOou/nZXPyFdVlhzQzLp0EGB+/WEjA5Zj4J39EDdyToXmxsVNezzZJG66kfhz1VmBd18WGGAPDvw9PAdR2LpybKXl9VvwY5CFHazkadFy8Any+nKHpn3R3MxRHaeJV3EZDJfC+C46BCULkAS8EnZAtfdTJubIE71cNoOu/WmQupYsotk1XT3aN07ctvYuhyejiE+6bU3awre/kOumyjzb/7UWeIMvwxbFor3fEUPJa70xFfqPJUpFyj8NXlPE5wIDAQAB
-----END PUBLIC KEY-----`,
    });

    const result = await generateJWK();
    expect(result.keyId).toEqual("da112a8b-023d-4eda-ae7d-33fde0a721b4");
  });

  it("throws error if kms client cannot be created", async () => {
    // Mock the responses for KMS functions
    (getKMSClient as jest.Mock).mockReturnValue(false);

    await expect(generateJWK()).rejects.toThrowError("KMS client not found.");
  });

  it("throws error if kms key generation fails", async () => {
    // Mock the responses for KMS functions
    (getKMSClient as jest.Mock).mockReturnValue(true);
    (createKMSKey as jest.Mock).mockReturnValue({});

    await expect(generateJWK()).rejects.toThrowError(
      "Unable to create KMS key."
    );
  });
});
