import axios from "axios";
import {
  createTestApp,
  createTestAppMetadata,
  createTestTeam,
  deleteTestApp,
  deleteTestAppMetadata,
  deleteTestTeam,
} from "helpers";
import { cleanupTestS3Files, createTestS3Files } from "../../helpers/s3-setup";

// TODO: Fix S3 setup
describe.skip("Hasura API - App Verification", () => {
  describe("POST /api/hasura/verify-app", () => {
    let testAppId: string;
    let testTeamId: string;
    let testMetadataId: string;
    let testTeamName: string = "Test Team for App Verification";
    let testFiles: string[] = ["showcase1.png", "showcase2.png"];

    beforeAll(async () => {
      // Set required AWS environment variables for tests
      process.env.ASSETS_S3_BUCKET_NAME = "world-id-assets-staging";
      process.env.ASSETS_S3_REGION = "us-east-1";

      // Create test app and metadata
      testTeamId = await createTestTeam(testTeamName);
      testAppId = await createTestApp("Test App for Verification", testTeamId);

      // Create real test files in S3
      await createTestS3Files(
        process.env.ASSETS_S3_BUCKET_NAME!,
        testAppId,
        testFiles
      );

      // Create app_metadata with awaiting_review status and showcase images
      const metadata = await createTestAppMetadata(
        testAppId,
        "Test App for Verification",
        "awaiting_review",
        testFiles // Add showcase images for app store approval
      );
      testMetadataId = metadata.id;
    });

    it("Verify App Without App Store Approval Successfully", async () => {
      const internalApiUrl = process.env.INTERNAL_API_URL;
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`,
      };

      const response = await axios.post(
        `${internalApiUrl}/api/hasura/verify-app?app_id=${testAppId}&reviewer_name=test_reviewer&is_reviewer_app_store_approved=false&is_reviewer_world_app_approved=false`,
        {
          action: {
            name: "verify_app",
          },
          input: {},
          session_variables: {
            "x-hasura-role": "admin",
          },
        },
        { headers }
      );

      expect(response.status).toBe(200);
      expect(response.data).toEqual(
        expect.objectContaining({
          success: true,
        })
      );
    });

    afterAll(async () => {
      // Clean up test data
      await deleteTestAppMetadata(testMetadataId);
      await deleteTestApp(testAppId);
      await deleteTestTeam(testTeamId);

      // Clean up test files from S3
      await cleanupTestS3Files(
        process.env.ASSETS_S3_BUCKET_NAME!,
        testAppId,
        testFiles
      );
    });
  });
});
