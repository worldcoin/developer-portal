import { POST } from "@/api/v2/verify";
import { NextRequest } from "next/server";
import { decodeToHexString } from "../../../../api/helpers/verify";
import { semaphoreProofParamsMock } from "../../../api/__mocks__/proof.mock";
import { integrationDBClean, integrationDBExecuteQuery } from "../../setup";

// Reset and seed the database before each test
beforeEach(async () => {
  // Reset the fetch mock before each test
  jest.resetAllMocks();

  // Clean the database
  await integrationDBClean();
});

// Test data
const getUrl = (app_id: string) =>
  new URL(`/api/v2/verify/${app_id}`, "http://localhost:3000");

const validBody = {
  ...semaphoreProofParamsMock,
  signal: undefined,
  action: "verify",
};

const createMockRequest = (
  url: URL | RequestInfo,
  body: Record<string, any>,
) => {
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
};

// Helper to get staging app ID from the database
const getStageAppId = async () => {
  const response = await integrationDBExecuteQuery(
    "SELECT id FROM app WHERE is_staging = true LIMIT 1;",
  );
  return response.rows[0]?.id;
};

// Helper to create test action in the database
const createTestAction = async (
  appId: string,
  actionName: string,
  maxVerifications: number,
) => {
  const actionResponse = await integrationDBExecuteQuery(
    `INSERT INTO action (app_id, action, max_verifications, external_nullifier, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id;`,
    [
      appId,
      actionName,
      maxVerifications,
      "0x1c75ff6366690115808bd58e4c6e3342068088703dffa0a0ee07f55892bb10bd",
      "active",
    ],
  );
  return actionResponse.rows[0]?.id;
};

// Helper to convert nullifier hash to integer representation
const nullifierHashToBigIntStr = (nullifierHash: string): string => {
  const normalized = nullifierHash.toLowerCase().trim().replace(/^0x/, "");
  return BigInt(`0x${normalized}`).toString();
};

// Helper to create a nullifier record directly
const createNullifierRecord = async (
  actionId: string,
  nullifierHash: string,
  uses: number,
) => {
  const nullifierHashInt = nullifierHashToBigIntStr(nullifierHash);

  await integrationDBExecuteQuery(
    `INSERT INTO nullifier (action_id, nullifier_hash, nullifier_hash_int, uses)
     VALUES ($1, $2, $3, $4);`,
    [actionId, nullifierHash, nullifierHashInt, uses],
  );

  return { nullifierHash, nullifierHashInt };
};

const createSuccessFetchMock = (allowedNullifierHashes: string[] = []) => {
  return jest.fn((url, options) => {
    try {
      // Parse the request body
      const body = JSON.parse(options.body);
      const receivedNullifierHash = body.nullifierHash;

      // Check if this nullifier hash is in the allowed list
      const isAllowed = allowedNullifierHashes.some((hash) => {
        // Normalize the allowed hash the same way
        const decodedAllowsHash = decodeToHexString(hash);

        return receivedNullifierHash === decodedAllowsHash;
      });

      if (isAllowed) {
        // Return success for allowed nullifier hashes
        return Promise.resolve(
          new Response(JSON.stringify({ status: "mined" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      } else {
        // Return error for non-allowed nullifier hashes
        return Promise.resolve(
          new Response("invalid semaphore proof", {
            status: 400,
            headers: { "Content-Type": "text/plain" },
          }),
        );
      }
    } catch (error) {
      console.error("Error in fetch mock:", error);
      return Promise.resolve(
        new Response("Error processing request", {
          status: 400,
          headers: { "Content-Type": "text/plain" },
        }),
      );
    }
  });
};

describe("/api/v2/verify [Security Vulnerabilities Integration Tests]", () => {
  // Test: Fix for vulnerability where case-insensitive nullifiers bypass verification limit
  it("should prevent case sensitivity bypass", async () => {
    const VALID_NULLIFIER_HASH =
      semaphoreProofParamsMock.nullifier_hash.toLowerCase();

    // Setup fetch mock to always succeed for this test
    global.fetch = createSuccessFetchMock([VALID_NULLIFIER_HASH]);

    // Get a staging app from the database
    const appId = await getStageAppId();
    expect(appId).toBeTruthy();

    // Create a test action with max 1 verification
    const actionId = await createTestAction(appId, "verify", 1);
    expect(actionId).toBeTruthy();

    // First verification request with lowercase
    const firstReq = createMockRequest(getUrl(appId), {
      ...validBody,
      nullifier_hash: VALID_NULLIFIER_HASH,
    });

    const ctx = { params: { app_id: appId } };

    // First verification should succeed
    const firstResponse = await POST(firstReq, ctx);
    expect(firstResponse.status).toBe(200);

    // Verify the nullifier was inserted in the database
    const nullifierCheck = await integrationDBExecuteQuery(
      "SELECT * FROM nullifier WHERE action_id = $1",
      [actionId],
    );
    expect(nullifierCheck.rows.length).toBe(1);

    // Second attempt with uppercase nullifier
    const upperCaseNullifier = VALID_NULLIFIER_HASH.toUpperCase();

    console.log("Testing case sensitivity bypass:", {
      original: VALID_NULLIFIER_HASH,
      uppercase: upperCaseNullifier,
      int: nullifierCheck.rows[0].nullifier_hash_int,
    });

    const secondReq = createMockRequest(getUrl(appId), {
      ...validBody,
      nullifier_hash: upperCaseNullifier,
    });

    // Second verification should fail because we now use int representation for comparison
    const secondResponse = await POST(secondReq, ctx);
    expect(secondResponse.status).toBe(400);

    const body = await secondResponse.json();
    expect(body).toEqual({
      attribute: "nullifier_hash",
      code: "validation_error",
      detail:
        "Invalid nullifier_hash. Must be a hex string with optional 0x prefix.",
    });
  });

  // Test: Fix for vulnerability where nullifiers without 0x prefix bypass verification limit
  it("should prevent prefix bypass", async () => {
    const VALID_NULLIFIER_HASH =
      semaphoreProofParamsMock.nullifier_hash.toLowerCase();
    expect(VALID_NULLIFIER_HASH.startsWith("0x")).toBe(true);

    // Setup fetch mock to always succeed for this test
    global.fetch = createSuccessFetchMock([VALID_NULLIFIER_HASH]);

    // Get a staging app from the database
    const appId = await getStageAppId();
    expect(appId).toBeTruthy();

    // Create a test action with max 1 verification
    const actionId = await createTestAction(appId, "verify", 1);
    expect(actionId).toBeTruthy();

    // First verification request with prefix
    const firstReq = createMockRequest(getUrl(appId), {
      ...validBody,
      nullifier_hash: VALID_NULLIFIER_HASH,
    });

    const ctx = { params: { app_id: appId } };

    // First verification should succeed
    const firstResponse = await POST(firstReq, ctx);
    expect(firstResponse.status).toBe(200);

    // Verify the nullifier was inserted in the database
    const nullifierCheck = await integrationDBExecuteQuery(
      "SELECT * FROM nullifier WHERE action_id = $1",
      [actionId],
    );
    expect(nullifierCheck.rows.length).toBe(1);

    // Second attempt with a different prefix
    const nullifierWithoutPrefix = "zz" + VALID_NULLIFIER_HASH.slice(2);

    console.log("Testing prefix bypass:", {
      withPrefix: VALID_NULLIFIER_HASH,
      withoutPrefix: nullifierWithoutPrefix,
      int: nullifierCheck.rows[0].nullifier_hash_int,
    });

    const secondReq = createMockRequest(getUrl(appId), {
      ...validBody,
      nullifier_hash: nullifierWithoutPrefix,
    });

    // Second verification should fail because we now use int representation for comparison
    const secondResponse = await POST(secondReq, ctx);
    expect(secondResponse.status).toBe(400);

    const body = await secondResponse.json();
    expect(body).toMatchObject({
      attribute: "nullifier_hash",
      code: "validation_error",
      detail:
        "Invalid nullifier_hash. Must be a hex string with optional 0x prefix.",
    });
  });

  // Test: Fix for vulnerability where nullifiers with different zero padding bypass verification limit
  it("should prevent zero padding bypass", async () => {
    // First nullifier with zero padding
    const paddedNullifier =
      "0x000000abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234";

    // Setup fetch mock to always succeed for this test
    global.fetch = createSuccessFetchMock([paddedNullifier]);

    // Get a staging app from the database
    const appId = await getStageAppId();
    expect(appId).toBeTruthy();

    // Create a test action with max 1 verification
    const actionId = await createTestAction(appId, "verify", 1);
    expect(actionId).toBeTruthy();

    // First verification request with padding
    const firstReq = createMockRequest(getUrl(appId), {
      ...validBody,
      nullifier_hash: paddedNullifier,
    });

    const ctx = { params: { app_id: appId } };

    // First verification should succeed
    const firstResponse = await POST(firstReq, ctx);
    expect(firstResponse.status).toBe(200);

    // Verify the nullifier was inserted in the database
    const nullifierCheck = await integrationDBExecuteQuery(
      "SELECT * FROM nullifier WHERE action_id = $1",
      [actionId],
    );
    expect(nullifierCheck.rows.length).toBe(1);

    // Second attempt with different padding
    const nonPaddedNullifier =
      "0xabcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234";

    console.log("Testing padding bypass:", {
      padded: paddedNullifier,
      nonPadded: nonPaddedNullifier,
      int: nullifierCheck.rows[0].nullifier_hash_int,
    });

    const secondReq = createMockRequest(getUrl(appId), {
      ...validBody,
      nullifier_hash: nonPaddedNullifier,
    });

    // Second verification should fail because we now use int representation for comparison
    const secondResponse = await POST(secondReq, ctx);
    expect(secondResponse.status).toBe(400);

    const body = await secondResponse.json();
    expect(body).toEqual({
      attribute: null,
      code: "max_verifications_reached",
      detail: "This person has already verified for this action.",
      app_id: appId,
    });
  });
});
