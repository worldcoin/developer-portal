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

describe("Hasura API - App Draft Management", () => {
  describe("POST /api/hasura/create-new-draft", () => {
    let testAppId: string;
    let testTeamId: string;
    let testMetadataId: string;
    let testUserId: string;
    let testMembershipId: string;
    let testTeamName: string = "Test Team for App Draft";

    // Environment variables
    const internalApiUrl = process.env.INTERNAL_API_URL;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`,
    };

    beforeAll(async () => {
      // Create test team and user
      testTeamId = await createTestTeam(testTeamName);
      testUserId = await createTestUser("test@example.com", testTeamId);

      // Create membership for user in team (required for access)
      testMembershipId = await createTestMembership(
        testUserId,
        testTeamId,
        "OWNER"
      );

      // Create test app
      testAppId = await createTestApp(
        "Test App for Draft Creation",
        testTeamId
      );

      // Create verified app_metadata (required for draft creation)
      const metadata = await createTestAppMetadata(
        testAppId,
        "Test App for Draft Creation",
        "verified" // Verified status required for draft creation
      );
      testMetadataId = metadata.id;
    });

    it("Create New Draft From Verified App Successfully", async () => {
      const response = await axios.post(
        `${internalApiUrl}/api/hasura/create-new-draft?app_id=${testAppId}&team_id=${testTeamId}`,
        {
          action: {
            name: "create_new_draft",
          },
          input: {
            app_id: testAppId,
            team_id: testTeamId,
          },
          session_variables: {
            "x-hasura-role": "user",
            "x-hasura-user-id": testUserId,
          },
        },
        { headers }
      );

      expect(
        response.status,
        `Create new draft request resolved with a wrong code:\n${JSON.stringify(response.data, null, 2)}`
      ).toBe(200);
      expect(response.data.success).toBe(true);
    });

    afterAll(async () => {
      // Clean up test data
      await deleteTestAppMetadata(testMetadataId);
      await deleteTestApp(testAppId);
      await deleteTestMembership(testMembershipId);
      await deleteTestUser(testUserId);
      await deleteTestTeam(testTeamId);
    });
  });
});
