import { fetchActiveJWK, generateJWK, retrieveJWK } from "@/api/helpers/jwks";
import { createKMSKey, getKMSClient } from "@/api/helpers/kms";
import { integrationDBClean, integrationDBExecuteQuery } from "./setup";

jest.mock("@/api/helpers/kms", () => {
  return {
    getKMSClient: jest.fn(),
    createKMSKey: jest.fn(),
    scheduleKeyDeletion: jest.fn(),
  };
});

jest.mock("@/api/helpers/kms", () =>
  require("tests/api/__mocks__/kms.mock.ts"),
);

beforeEach(integrationDBClean);
describe("jwks management", () => {
  it("can retrieve existing jwks", async () => {
    const { rows } = await integrationDBExecuteQuery(
      'SELECT * FROM "public"."jwks" LIMIT 1;',
    );

    const jwk = await retrieveJWK(rows[0].id);
    expect(jwk.kid).toEqual(rows[0].id);
    expect(jwk.kms_id).toEqual(rows[0].kms_id);
  });

  it("throws error if the jwk is not found", async () => {
    await expect(retrieveJWK("non-existing-jwk")).rejects.toThrowError(
      "JWK not found.",
    );
  });

  it("fetches an active jwk", async () => {
    const { rows } = await integrationDBExecuteQuery(
      'SELECT * FROM "public"."jwks" LIMIT 1;',
    );

    const jwk = await fetchActiveJWK();
    expect(jwk.kid).toEqual(rows[0].id);
  });

  it("does not rotate a jwk with more than 7 days to expire", async () => {
    const { rows } = await integrationDBExecuteQuery(
      'SELECT * FROM "public"."jwks" WHERE "expires_at" > NOW() + INTERVAL \'7 days\' LIMIT 1;',
    );

    const jwk = await fetchActiveJWK();
    expect(jwk.kid).toEqual(rows[0].id);
  });

  it("rotates a jwk with less than 7 days to expire", async () => {
    const { rows } = await integrationDBExecuteQuery(
      'UPDATE "public"."jwks" SET "expires_at" = NOW() + INTERVAL \'6 days\' WHERE "id" = (SELECT id FROM "public"."jwks" LIMIT 1) RETURNING "id";',
    );

    const jwk = await fetchActiveJWK();
    expect(jwk.kid).not.toEqual(rows[0].id);
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
      "Unable to create KMS key.",
    );
  });
});
