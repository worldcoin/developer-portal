import axios from "axios";
import {
  createTestApp,
  createTestAppMetadata,
  createTestLocalisation,
  createTestMembership,
  createTestTeam,
  createTestUser,
  deleteTestApp,
  deleteTestAppMetadata,
  deleteTestLocalisation,
  deleteTestMembership,
  deleteTestTeam,
  deleteTestUser,
} from "helpers";
import { cleanupTestS3Files, createTestS3Files } from "../../helpers/s3-setup";

describe("Hasura API - Get Image", () => {
  describe("POST /api/hasura/get-image", () => {
    let testAppId: string | undefined;
    let testTeamId: string | undefined;
    let testUserId: string | undefined;
    let testMembershipId: string | undefined;
    let testMetadataId: string | undefined;
    let testLocalisationId: string | undefined;
    let testTeamName: string = "Test Team for Get Image";
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
        `getimage_${Date.now()}@example.com`,
        testTeamId!
      );

      // Create membership for user in team with OWNER role
      testMembershipId = await createTestMembership(
        testUserId!,
        testTeamId!,
        "OWNER"
      );

      // Create test app
      testAppId = await createTestApp("Test App for Get Image", testTeamId!);

      // Create test app metadata with unverified status
      const metadata = await createTestAppMetadata(
        testAppId!,
        "Test App for Get Image",
        "unverified",
        ["showcase_img_1.jpg"], // Only showcase images
        ["en", "es"] // Supported languages
      );
      testMetadataId = metadata.id;

      // Create localisation for Spanish
      testLocalisationId = await createTestLocalisation(
        testMetadataId!,
        "es",
        "Aplicación de Prueba para Obtener Imagen",
        "App Imagen",
        "Descripción de la aplicación de prueba para obtener imagen",
        "Descripción de la aplicación de prueba para obtener imagen en español"
      );

      // Create test files in S3 for both English and Spanish
      await createTestS3Files(
        process.env.ASSETS_S3_BUCKET_NAME!,
        testAppId!,
        testFiles
      );
      await createTestS3Files(
        process.env.ASSETS_S3_BUCKET_NAME!,
        `${testAppId!}/es`,
        testFiles
      );
    });

    it("Get English Logo Image Successfully", async () => {
      const response = await axios.post(
        `${internalApiUrl}/api/hasura/get-image?app_id=${testAppId}&image_type=logo_image&content_type_ending=png`,
        {
          action: {
            name: "get_uploaded_image",
          },
          input: {
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
        `Get image request resolved with a wrong code:\n${JSON.stringify(response.data, null, 2)}`
      ).toBe(200);
      expect(response.data.url).toBeDefined();
      expect(typeof response.data.url).toBe("string");
      expect(response.data.url).toContain("logo_image.png");
    });

    it("Get English Hero Image Successfully", async () => {
      const response = await axios.post(
        `${internalApiUrl}/api/hasura/get-image?app_id=${testAppId}&image_type=hero_image&content_type_ending=jpeg`,
        {
          action: {
            name: "get_uploaded_image",
          },
          input: {
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
        `Get image request resolved with a wrong code:\n${JSON.stringify(response.data, null, 2)}`
      ).toBe(200);
      expect(response.data.url).toBeDefined();
      expect(typeof response.data.url).toBe("string");
      expect(response.data.url).toContain("hero_image.jpg");
    });

    it("Get Localized Spanish Logo Image Successfully", async () => {
      const response = await axios.post(
        `${internalApiUrl}/api/hasura/get-image?app_id=${testAppId}&image_type=logo_image&content_type_ending=png&locale=es`,
        {
          action: {
            name: "get_uploaded_image",
          },
          input: {
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
        `Get image request resolved with a wrong code:\n${JSON.stringify(response.data, null, 2)}`
      ).toBe(200);
      expect(response.data.url).toBeDefined();
      expect(typeof response.data.url).toBe("string");
      expect(response.data.url).toContain("logo_image.png");
      // Should point to localized version
      expect(response.data.url).toContain("/es/");
    });

    afterAll(async () => {
      // Clean up test data
      void (
        testLocalisationId && (await deleteTestLocalisation(testLocalisationId))
      );
      void (testMetadataId && (await deleteTestAppMetadata(testMetadataId)));
      void (testAppId && (await deleteTestApp(testAppId)));
      void (testMembershipId && (await deleteTestMembership(testMembershipId)));
      void (testUserId && (await deleteTestUser(testUserId)));
      void (testTeamId && (await deleteTestTeam(testTeamId)));

      // Clean up test files from S3
      await Promise.all([
        cleanupTestS3Files(
          process.env.ASSETS_S3_BUCKET_NAME!,
          testAppId!,
          testFiles
        ),
        cleanupTestS3Files(
          process.env.ASSETS_S3_BUCKET_NAME!,
          `${testAppId!}/es`,
          testFiles
        ),
      ]);
    });
  });
});
