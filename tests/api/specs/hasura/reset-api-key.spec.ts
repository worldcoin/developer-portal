import axios from "axios";
import {
  createTestApp,
  createTestAppMetadata,
  createTestMembership,
  createTestTeam,
  createTestUser,
  deleteTestApp,
  deleteTestAppMetadata,
  deleteTestMembership,
  deleteTestTeam,
  deleteTestUser,
} from "helpers";

describe("Hasura API - Reset API Key", () => {
  describe("POST /api/hasura/reset-api-key", () => {
    let testAppId: string | undefined;
    let testTeamId: string | undefined;
    let testUserId: string | undefined;
    let testMembershipId: string | undefined;
    let testMetadataId: string | undefined;
    let testTeamName: string = "Test Team for Reset API Key";

    // Environment variables
    const internalApiUrl = process.env.INTERNAL_API_URL;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`,
    };

    beforeAll(async () => {
      // Create test team and user
      testTeamId = await createTestTeam(testTeamName);
      testUserId = await createTestUser(
        `resetapikey_${Date.now()}@example.com`,
        testTeamId!
      );

      // Create membership for user in team with OWNER role
      testMembershipId = await createTestMembership(
        testUserId!,
        testTeamId!,
        "OWNER"
      );

      // Create test app
      testAppId = await createTestApp(
        "Test App for Reset API Key",
        testTeamId!
      );

      // Create test app metadata
      const metadata = await createTestAppMetadata(
        testAppId!,
        "Test App for Reset API Key",
        "unverified",
        ["showcase_img_1.jpg"],
        ["en"]
      );
      testMetadataId = metadata.id;
    });

    it("Reset API Key Successfully", async () => {
      const response = await axios.post(
        `${internalApiUrl}/api/hasura/reset-api-key`,
        {
          action: {
            name: "reset_api_key",
          },
          input: {
            team_id: testTeamId,
            id: testAppId,
          },
          session_variables: {
            "x-hasura-role": "user",
            "x-hasura-user-id": testUserId,
          },
        },
        { headers }
      );

      expect(response.status).toBe(200);
      expect(response.data.api_key).toBeDefined();
      expect(typeof response.data.api_key).toBe("string");
      expect(response.data.api_key).toContain("api_");
    });

    afterAll(async () => {
      // Clean up test data
      testMetadataId && (await deleteTestAppMetadata(testMetadataId));
      testAppId && (await deleteTestApp(testAppId));
      testMembershipId && (await deleteTestMembership(testMembershipId));
      testUserId && (await deleteTestUser(testUserId));
      testTeamId && (await deleteTestTeam(testTeamId));
    });
  });
});
