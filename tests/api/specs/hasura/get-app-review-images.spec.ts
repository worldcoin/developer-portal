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

describe('Hasura API - Get App Review Images', () => {
  describe('POST /api/hasura/get-app-review-images', () => {
    let testAppId: string;
    let testTeamId: string;
    let testUserId: string;
    let testMembershipId: string;
    let testMetadataId: string;
    let testLocalisationId: string;
    let testTeamName: string = 'Test Team for Review Images';
    
    // Environment variables
    const internalApiUrl = process.env.INTERNAL_API_URL;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`
    };

    beforeAll(async () => {
      // Create test team and user
      testTeamId = await createTestTeam(testTeamName);
      testUserId = await createTestUser('reviewer@example.com', testTeamId);
      
      // Create membership for user in team with OWNER role
      testMembershipId = await createTestMembership(testUserId, testTeamId, 'OWNER');
      
      // Create test app
      testAppId = await createTestApp('Test App for Review Images', testTeamId);
      
      // Create test app metadata with awaiting_review status and images
      const metadata = await createTestAppMetadata(
        testAppId, 
        'Test App for Review Images', 
        'awaiting_review',
        ['showcase1.png', 'showcase2.png'], // showcase images
        ['en', 'es'] // supported languages
      );
      testMetadataId = metadata.id;

      // Create localisation for Spanish
      testLocalisationId = await createTestLocalisation(
        testMetadataId,
        'es',
        'Aplicación de Prueba para Imágenes de Revisión',
        'App Revisión',
        'Descripción de la aplicación de prueba para imágenes de revisión',
        'Descripción de la aplicación de prueba para imágenes de revisión en español'
      );
    });

    it('Get Review Images for English Locale Successfully', async () => {
      const response = await axios.post(
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

      expect(
        response.status,
        `Get app review images request resolved with a wrong code:\n${JSON.stringify(response.data, null, 2)}`
      ).toBe(200);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data.showcase_img_urls)).toBe(true);
    });

    it('Get Review Images with Admin Role Successfully', async () => {
      const response = await axios.post(
        `${internalApiUrl}/api/hasura/get-app-review-images?app_id=${testAppId}&locale=en`,
        {
          action: {
            name: "get_app_review_images"
          },
          input: {},
          session_variables: {
            "x-hasura-role": "admin",
            "x-hasura-user-id": testUserId
          }
        },
        { headers }
      );

      expect(
        response.status,
        `Get app review images request resolved with a wrong code:\n${JSON.stringify(response.data, null, 2)}`
      ).toBe(200);
      expect(response.data).toBeDefined();
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