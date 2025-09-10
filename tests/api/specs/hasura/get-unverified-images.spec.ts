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
import { cleanupTestS3Files, createTestS3Files } from "helpers/s3-setup";

describe("Hasura API - Get Unverified Images", () => {
  describe("POST /api/hasura/get-unverified-images", () => {
    let testAppId: string | undefined;
    let testTeamId: string | undefined;
    let testUserId: string | undefined;
    let testMembershipId: string | undefined;
    let testMetadataId: string | undefined;
    let testTeamName: string = "Test Team for Get Unverified Images";
    let testFiles: string[] = ["logo.png", "hero.jpg", "showcase_img_1.jpg"];

    // Environment variables
    const internalApiUrl = process.env.INTERNAL_API_URL;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`,
    };

    beforeAll(async () => {
      // Set required AWS environment variables for tests
      process.env.ASSETS_S3_BUCKET_NAME = "world-id-assets-staging";
      process.env.ASSETS_S3_REGION = "us-east-1";

      // Create test team and user
      testTeamId = await createTestTeam(testTeamName);
      testUserId = await createTestUser(
        `getunverified_${Date.now()}@example.com`,
        testTeamId!,
      );

      // Create membership for user in team with OWNER role
      testMembershipId = await createTestMembership(
        testUserId!,
        testTeamId!,
        "OWNER",
      );

      // Create test app
      testAppId = await createTestApp(
        "Test App for Get Unverified Images",
        testTeamId!,
      );

      // Create test app metadata with unverified status
      const metadata = await createTestAppMetadata(
        testAppId!,
        "Test App for Get Unverified Images",
        "unverified",
        ["showcase_img_1.jpg"], // Only showcase images
        ["en", "es"], // Supported languages
      );
      testMetadataId = metadata.id;

      // Create test files in S3 for both English and Spanish
      await createTestS3Files(
        process.env.ASSETS_S3_BUCKET_NAME!,
        testAppId!,
        testFiles,
      );
      await createTestS3Files(
        process.env.ASSETS_S3_BUCKET_NAME!,
        `${testAppId!}/es`,
        testFiles,
      );
    });

    it("Get English Unverified Images Successfully", async () => {
      const response = await axios.post(
        `${internalApiUrl}/api/hasura/get-unverified-images?app_id=${testAppId}&locale=en`,
        {
          action: {
            name: "get_all_unverified_images",
          },
          input: {
            team_id: testTeamId,
          },
          session_variables: {
            "x-hasura-role": "user",
            "x-hasura-user-id": testUserId,
          },
        },
        { headers },
      );

      expect(
        response.status,
        `Get unverified images request resolved with a wrong code:\n${JSON.stringify(response.data, null, 2)}`,
      ).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.logo_img_url).toBeDefined();
      expect(typeof response.data.logo_img_url).toBe("string");
      expect(response.data.logo_img_url).toContain("logo_img.png");
      expect(Array.isArray(response.data.showcase_img_urls)).toBe(true);
    });

    afterAll(async () => {
      // Clean up test data
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      testMetadataId && (await deleteTestAppMetadata(testMetadataId));
      testAppId && (await deleteTestApp(testAppId));
      testMembershipId && (await deleteTestMembership(testMembershipId));
      testUserId && (await deleteTestUser(testUserId));
      testTeamId && (await deleteTestTeam(testTeamId));
      /* eslint-enable @typescript-eslint/no-unused-expressions */

      // Clean up test files from S3
      Promise.all([
        cleanupTestS3Files(
          process.env.ASSETS_S3_BUCKET_NAME!,
          testAppId!,
          testFiles,
        ),
        cleanupTestS3Files(
          process.env.ASSETS_S3_BUCKET_NAME!,
          `${testAppId!}/es`,
          testFiles,
        ),
      ]);
    });
  });
});
