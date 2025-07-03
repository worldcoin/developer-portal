import { generateHashedSecret } from "@/api/helpers/utils";
import { GET } from "@/api/v2/verifications";
import { NextRequest } from "next/server";
import { integrationDBClean, integrationDBExecuteQuery } from "../../setup";

// Reset and seed the database before each test
beforeEach(async () => {
  jest.resetAllMocks();
  await integrationDBClean();
});

// Helper to create a test app with API key
const createTestAppWithKey = async () => {
  // First, create a team
  const teamResult = await integrationDBExecuteQuery(
    `INSERT INTO team (name) VALUES ($1) RETURNING id;`,
    ["Test Team for Verifications"],
  );
  const teamId = teamResult.rows[0].id;

  // Create a user and membership
  const userResult = await integrationDBExecuteQuery(
    `INSERT INTO "user" (name, email, ironclad_id, is_subscribed) VALUES ($1, $2, $3, $4) RETURNING id;`,
    [
      "Test User",
      "test@example.com",
      `ironclad_test_${Math.random().toString(36).substring(7)}`,
      false,
    ],
  );
  const userId = userResult.rows[0].id;

  await integrationDBExecuteQuery(
    `INSERT INTO membership (user_id, team_id, role) VALUES ($1, $2, $3);`,
    [userId, teamId, "OWNER"],
  );

  // Create an app with only the columns that exist in test database
  const appResult = await integrationDBExecuteQuery(
    `INSERT INTO app (name, team_id, is_staging, engine, status) 
     VALUES ($1, $2, $3, $4, $5) RETURNING id;`,
    ["Test App", teamId, true, "cloud", "active"],
  );
  const appId = appResult.rows[0].id;

  // Create an API key with proper format
  const apiKeyId =
    "key_" + Math.random().toString(36).substring(7).padEnd(32, "0");
  const { secret, hashed_secret } = generateHashedSecret(apiKeyId);

  const apiKeyResult = await integrationDBExecuteQuery(
    `INSERT INTO api_key (id, name, team_id, is_active, api_key) 
     VALUES ($1, $2, $3, $4, $5) RETURNING id, api_key;`,
    [apiKeyId, "Test API Key", teamId, true, hashed_secret],
  );

  // Create the properly formatted API key for the Bearer token
  const fullApiKey = `api_${Buffer.from(`${apiKeyId}:${secret}`).toString("base64").replace(/=/g, "")}`;

  return {
    app_id: appId,
    team_id: teamId,
    user_id: userId,
    api_key_id: apiKeyId,
    api_key: fullApiKey,
  };
};

// Helper to create test actions with verifications
const createTestData = async (appId: string) => {
  // Create multiple actions
  const action1 = await integrationDBExecuteQuery(
    `INSERT INTO action (app_id, action, external_nullifier, status)
     VALUES ($1, $2, $3, $4)
     RETURNING id;`,
    [appId, "test_action_1", "0x1234567890abcdef", "active"],
  );

  const action2 = await integrationDBExecuteQuery(
    `INSERT INTO action (app_id, action, external_nullifier, status)
     VALUES ($1, $2, $3, $4)
     RETURNING id;`,
    [appId, "test_action_2", "0xabcdef1234567890", "active"],
  );

  // Create nullifiers (verifications) with different dates
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Action 1 nullifiers
  await integrationDBExecuteQuery(
    `INSERT INTO nullifier (action_id, nullifier_hash, uses, created_at, updated_at)
     VALUES 
       ($1, $2, $3, $4, $5),
       ($1, $6, $7, $8, $9),
       ($1, $10, $11, $12, $13);`,
    [
      action1.rows[0].id,
      "0x111111",
      5,
      oneWeekAgo,
      now,
      "0x222222",
      2,
      oneMonthAgo,
      oneMonthAgo,
      "0x333333",
      1,
      twoMonthsAgo,
      twoMonthsAgo,
    ],
  );

  // Action 2 nullifiers
  await integrationDBExecuteQuery(
    `INSERT INTO nullifier (action_id, nullifier_hash, uses, created_at, updated_at)
     VALUES 
       ($1, $2, $3, $4, $5),
       ($1, $6, $7, $8, $9);`,
    [
      action2.rows[0].id,
      "0x444444",
      3,
      oneWeekAgo,
      oneWeekAgo,
      "0x555555",
      10,
      oneMonthAgo,
      now,
    ],
  );

  return {
    action1Id: action1.rows[0].id,
    action2Id: action2.rows[0].id,
    dates: { now, oneWeekAgo, oneMonthAgo, twoMonthsAgo },
  };
};

describe("/api/v2/verifications [Integration Tests]", () => {
  describe("GET", () => {
    it("should fetch all verifications for an action with valid API key", async () => {
      // Create app and API key
      const { app_id, api_key } = await createTestAppWithKey();
      expect(app_id).toBeTruthy();
      expect(api_key).toBeTruthy();

      // Create test data
      const { action1Id } = await createTestData(app_id);

      // Make request for test_action_1
      const req = new NextRequest(
        `http://localhost:3000/api/v2/verifications?app_id=${app_id}&action_id=${action1Id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${api_key}`,
          },
        },
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result.verifications).toHaveLength(3);
      expect(data.result.pagination.total_count).toBe(3);
      expect(data.result.pagination.has_next_page).toBe(false);
    });

    it("should filter verifications by action_id", async () => {
      const { app_id, api_key } = await createTestAppWithKey();
      const { action1Id } = await createTestData(app_id);

      const req = new NextRequest(
        `http://localhost:3000/api/v2/verifications?app_id=${app_id}&action_id=${action1Id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${api_key}`,
          },
        },
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.result.verifications).toHaveLength(3);
      // All verifications should be for test_action_1
      data.result.verifications.forEach((v: any) => {
        expect(v.action).toBe("test_action_1");
      });
    });

    it("should filter verifications by date range", async () => {
      const { app_id, api_key } = await createTestAppWithKey();
      const { action1Id, dates } = await createTestData(app_id);

      // Query for verifications from last 2 weeks
      const twoWeeksAgo = new Date(
        dates.now.getTime() - 14 * 24 * 60 * 60 * 1000,
      );

      const req = new NextRequest(
        `http://localhost:3000/api/v2/verifications?app_id=${app_id}&action_id=${action1Id}&start_date=${twoWeeksAgo.toISOString()}&end_date=${dates.now.toISOString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${api_key}`,
          },
        },
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should only get verifications from the last 2 weeks (1 nullifier for test_action_1)
      expect(data.result.verifications).toHaveLength(1);
    });

    it("should handle pagination correctly", async () => {
      const { app_id, api_key } = await createTestAppWithKey();
      const { action1Id } = await createTestData(app_id);

      // First page
      const req1 = new NextRequest(
        `http://localhost:3000/api/v2/verifications?app_id=${app_id}&action_id=${action1Id}&limit=2&offset=0`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${api_key}`,
          },
        },
      );

      const response1 = await GET(req1);
      const data1 = await response1.json();

      expect(response1.status).toBe(200);
      expect(data1.result.verifications).toHaveLength(2);
      expect(data1.result.pagination.has_next_page).toBe(true);
      expect(data1.result.pagination.current_page).toBe(1);

      // Second page
      const req2 = new NextRequest(
        `http://localhost:3000/api/v2/verifications?app_id=${app_id}&action_id=${action1Id}&limit=2&offset=2`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${api_key}`,
          },
        },
      );

      const response2 = await GET(req2);
      const data2 = await response2.json();

      expect(response2.status).toBe(200);
      expect(data2.result.verifications).toHaveLength(1);
      expect(data2.result.pagination.current_page).toBe(2);

      // Verify different results
      expect(data1.result.verifications[0].id).not.toBe(
        data2.result.verifications[0].id,
      );
    });

    it("should combine all filters correctly", async () => {
      const { app_id, api_key } = await createTestAppWithKey();
      const { action1Id, dates } = await createTestData(app_id);

      // Query for test_action_1 in the last month with pagination
      const oneMonthAgo = new Date(
        dates.now.getTime() - 30 * 24 * 60 * 60 * 1000,
      );

      const req = new NextRequest(
        `http://localhost:3000/api/v2/verifications?app_id=${app_id}&action_id=${action1Id}&start_date=${oneMonthAgo.toISOString()}&end_date=${dates.now.toISOString()}&limit=1&offset=0`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${api_key}`,
          },
        },
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.result.verifications).toHaveLength(1);
      expect(data.result.verifications[0].action).toBe("test_action_1");
      expect(data.result.pagination.limit).toBe(1);
    });

    it("should return 403 for invalid API key", async () => {
      const { app_id } = await createTestAppWithKey();
      const { action1Id } = await createTestData(app_id);

      const req = new NextRequest(
        `http://localhost:3000/api/v2/verifications?app_id=${app_id}&action_id=${action1Id}`,
        {
          method: "GET",
          headers: {
            Authorization: "Bearer invalid_api_key",
          },
        },
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe("invalid_api_key");
      expect(data.detail).toBe("API key is not valid.");
    });

    it("should return 403 when API key belongs to different team than the action", async () => {
      const { app_id, api_key, team_id } = await createTestAppWithKey();

      // Create another team with app and action
      const otherTeamResult = await integrationDBExecuteQuery(
        `INSERT INTO team (name) VALUES ($1) RETURNING id;`,
        ["Other Team"],
      );
      const otherTeamId = otherTeamResult.rows[0].id;

      const otherApp = await integrationDBExecuteQuery(
        `INSERT INTO app (name, team_id, is_staging, engine, status)
         VALUES ($1, $2, true, 'cloud', 'active')
         RETURNING id;`,
        ["Other Test App", otherTeamId],
      );

      const otherAppId = otherApp.rows[0].id;

      // Create an action in the other team's app
      const otherAction = await integrationDBExecuteQuery(
        `INSERT INTO action (app_id, action, external_nullifier, status)
         VALUES ($1, $2, $3, $4)
         RETURNING id;`,
        [otherAppId, "other_team_action", "0xOtherTeamAction", "active"],
      );

      // Create some verifications for the other team's action
      await integrationDBExecuteQuery(
        `INSERT INTO nullifier (action_id, nullifier_hash, uses, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5);`,
        [otherAction.rows[0].id, "0x999999", 1, new Date(), new Date()],
      );

      // Try to use first team's API key to access second team's action
      const req = new NextRequest(
        `http://localhost:3000/api/v2/verifications?app_id=${otherAppId}&action_id=other_team_action`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${api_key}`,
          },
        },
      );

      const response = await GET(req);
      const data = await response.json();

      // The verifyApiKey helper now properly validates that the API key belongs to the app
      expect(response.status).toBe(403);
      expect(data.code).toBe("invalid_app");
      expect(data.detail).toBe("API key is not valid for this app.");
    });

    it("should return empty results when no verifications exist", async () => {
      const { app_id, api_key } = await createTestAppWithKey();
      // Create an action but no verifications
      const action = await integrationDBExecuteQuery(
        `INSERT INTO action (app_id, action, external_nullifier, status)
         VALUES ($1, $2, $3, $4)
         RETURNING id;`,
        [app_id, "empty_action", "0xempty", "active"],
      );
      const actionId = action.rows[0].id;

      const req = new NextRequest(
        `http://localhost:3000/api/v2/verifications?app_id=${app_id}&action_id=${actionId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${api_key}`,
          },
        },
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.result.verifications).toHaveLength(0);
      expect(data.result.pagination.total_count).toBe(0);
      expect(data.result.pagination.has_next_page).toBe(false);
    });

    it("should handle date range edge cases correctly", async () => {
      const { app_id, api_key } = await createTestAppWithKey();
      const { action1Id } = await createTestData(app_id);

      // Test with dates without time component
      const req = new NextRequest(
        `http://localhost:3000/api/v2/verifications?app_id=${app_id}&action_id=${action1Id}&start_date=2024-01-01&end_date=2024-03-31`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${api_key}`,
          },
        },
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should order results by created_at descending", async () => {
      const { app_id, api_key } = await createTestAppWithKey();
      const { action1Id } = await createTestData(app_id);

      const req = new NextRequest(
        `http://localhost:3000/api/v2/verifications?app_id=${app_id}&action_id=${action1Id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${api_key}`,
          },
        },
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Verify ordering - each verification's created_at should be >= the next one
      for (let i = 0; i < data.result.verifications.length - 1; i++) {
        const current = new Date(
          data.result.verifications[i].first_verified_at,
        );
        const next = new Date(
          data.result.verifications[i + 1].first_verified_at,
        );
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });
  });
});
