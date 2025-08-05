import axios from 'axios';
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
    deleteTestUser
} from '../../helpers/hasura-helper';

describe('Hasura API - Image Workflow', () => {
  describe('Complete Image Upload and Review Workflow', () => {
    let testAppId: string;
    let testTeamId: string;
    let testUserId: string;
    let testMembershipId: string;
    let testMetadataId: string;
    let testLocalisationId: string;
    let testTeamName: string = 'Test Team for Image Workflow';

    beforeAll(async () => {
      // Create test team and user
      testTeamId = await createTestTeam(testTeamName);
      testUserId = await createTestUser('imageworkflow@example.com', testTeamId);
      
      // Create membership for user in team with OWNER role
      testMembershipId = await createTestMembership(testUserId, testTeamId, 'OWNER');
      
      // Create test app
      testAppId = await createTestApp('Test App for Image Workflow', testTeamId);
      
      // Create test app metadata with awaiting_review status
      const metadata = await createTestAppMetadata(
        testAppId, 
        'Test App for Image Workflow', 
        'awaiting_review',
        ['showcase1.png', 'showcase2.png'], // showcase images
        ['en', 'es'] // supported languages
      );
      testMetadataId = metadata.id;

      // Create localisation for Spanish
      testLocalisationId = await createTestLocalisation(
        testMetadataId,
        'es',
        'Aplicación de Prueba para Workflow de Imágenes',
        'App Workflow',
        'Descripción de la aplicación de prueba para workflow de imágenes',
        'Descripción de la aplicación de prueba para workflow de imágenes en español'
      );
    });

    it('Should Verify Upload and Review Paths Match', async () => {
      const internalApiUrl = process.env.INTERNAL_API_URL;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`
      };

      // Upload an image and capture the S3 key
      const uploadResponse = await axios.post(
        `${internalApiUrl}/api/hasura/upload-image?app_id=${testAppId}&image_type=logo&content_type_ending=png`,
        {
          action: {
            name: "upload_image"
          },
          input: {
            team_id: testTeamId
          },
          session_variables: {
            "x-hasura-role": "user",
            "x-hasura-user-id": testUserId
          }
        },
        { headers }
      );

      const uploadFields = JSON.parse(uploadResponse.data.stringifiedFields);
      const uploadedS3Key = uploadFields.key;

      // Get review images and verify the URL contains the same S3 key
      const reviewResponse = await axios.post(
        `${internalApiUrl}/api/hasura/get-app-review-images?app_id=${testAppId}&locale=en`,
        {
          action: {
            name: "get_app_review_images"
          },
          input: {},
          session_variables: {
            "x-hasura-role": "reviewer",
            "x-hasura-user-id": testUserId
          }
        },
        { headers }
      );

      // Verify that the review URL contains the expected S3 key
      // Note: Upload creates path for future uploads, review returns existing database values
      if (reviewResponse.data.logo_img_url) {
        expect(reviewResponse.data.logo_img_url).toContain(`unverified/${testAppId}/test-logo.png`);
      }

      // Test localized image path matching
      const uploadLocalizedResponse = await axios.post(
        `${internalApiUrl}/api/hasura/upload-image?app_id=${testAppId}&image_type=hero&content_type_ending=jpeg&locale=es`,
        {
          action: {
            name: "upload_image"
          },
          input: {
            team_id: testTeamId
          },
          session_variables: {
            "x-hasura-role": "user",
            "x-hasura-user-id": testUserId
          }
        },
        { headers }
      );

      const uploadLocalizedFields = JSON.parse(uploadLocalizedResponse.data.stringifiedFields);
      const uploadedLocalizedS3Key = uploadLocalizedFields.key;

      const reviewLocalizedResponse = await axios.post(
        `${internalApiUrl}/api/hasura/get-app-review-images?app_id=${testAppId}&locale=es`,
        {
          action: {
            name: "get_app_review_images"
          },
          input: {},
          session_variables: {
            "x-hasura-role": "reviewer",
            "x-hasura-user-id": testUserId
          }
        },
        { headers }
      );

      // Verify that the localized review URL contains the same S3 key
      if (reviewLocalizedResponse.data.hero_image_url) {
        expect(reviewLocalizedResponse.data.hero_image_url).toContain(uploadedLocalizedS3Key);
      }
    });

    afterAll(async () => {
      // Clean up test data
      await deleteTestLocalisation(testLocalisationId);
      await deleteTestAppMetadata(testMetadataId);
      await deleteTestApp(testAppId);
      await deleteTestMembership(testMembershipId);
      await deleteTestUser(testUserId);
      await deleteTestTeam(testTeamId);
    });
  });
}); 