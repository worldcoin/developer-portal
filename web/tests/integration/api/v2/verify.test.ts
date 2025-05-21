import { POST } from "@/api/v2/verify";
import { NextRequest } from "next/server";
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

// Mock for the fetch function that always returns a successful response
const createSuccessFetchMock = () => {
  return jest.fn().mockResolvedValue(
    new Response(JSON.stringify({ status: "mined" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
};

describe("/api/v2/verify [Security Vulnerabilities Integration Tests]", () => {
  // Test: Fix for vulnerability where case-insensitive nullifiers bypass verification limit
  it("should prevent case sensitivity bypass", async () => {
    // Setup fetch mock to always succeed for this test
    global.fetch = createSuccessFetchMock();

    // Get a staging app from the database
    const appId = await getStageAppId();
    expect(appId).toBeTruthy();

    // Create a test action with max 1 verification
    const actionId = await createTestAction(appId, "verify", 1);
    expect(actionId).toBeTruthy();

    // First nullifier (lowercase)
    const originalNullifier =
      semaphoreProofParamsMock.nullifier_hash.toLowerCase();

    // First verification request with lowercase
    const firstReq = createMockRequest(getUrl(appId), {
      ...validBody,
      nullifier_hash: originalNullifier,
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
    const upperCaseNullifier = originalNullifier.toUpperCase();

    console.log("Testing case sensitivity bypass:", {
      original: originalNullifier,
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
      attribute: null,
      code: "max_verifications_reached",
      detail: "This person has already verified for this action.",
      app_id: appId,
    });
  });

  // Test: Fix for vulnerability where nullifiers without 0x prefix bypass verification limit
  it("should prevent prefix bypass", async () => {
    // Setup fetch mock to always succeed for this test
    global.fetch = createSuccessFetchMock();

    // Get a staging app from the database
    const appId = await getStageAppId();
    expect(appId).toBeTruthy();

    // Create a test action with max 1 verification
    const actionId = await createTestAction(appId, "verify", 1);
    expect(actionId).toBeTruthy();

    // First nullifier with 0x prefix
    const nullifierWithPrefix = semaphoreProofParamsMock.nullifier_hash;

    // First verification request with prefix
    const firstReq = createMockRequest(getUrl(appId), {
      ...validBody,
      nullifier_hash: nullifierWithPrefix,
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

    // Second attempt without 0x prefix
    const nullifierWithoutPrefix = nullifierWithPrefix.slice(2);

    console.log("Testing prefix bypass:", {
      withPrefix: nullifierWithPrefix,
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
    expect(body).toEqual({
      attribute: null,
      code: "max_verifications_reached",
      detail: "This person has already verified for this action.",
      app_id: appId,
    });
  });

  // Test: Fix for vulnerability where nullifiers with different zero padding bypass verification limit
  it("should prevent zero padding bypass", async () => {
    // Setup fetch mock to always succeed for this test
    global.fetch = createSuccessFetchMock();

    // Get a staging app from the database
    const appId = await getStageAppId();
    expect(appId).toBeTruthy();

    // Create a test action with max 1 verification
    const actionId = await createTestAction(appId, "verify", 1);
    expect(actionId).toBeTruthy();

    // First nullifier with zero padding
    const paddedNullifier =
      "0x000000abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234";

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
