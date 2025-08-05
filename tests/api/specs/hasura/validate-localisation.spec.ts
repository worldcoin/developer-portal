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

describe('Hasura API - Validate Localisation', () => {
  describe('POST /api/hasura/validate-localisation', () => {
    let testAppId: string;
    let testTeamId: string;
    let testUserId: string;
    let testMembershipId: string;
    let testMetadataId: string;
    let testLocalisationIds: string[] = [];
    let testTeamName: string = 'Test Team for Localisation';

    beforeAll(async () => {
      // Create test team and user
      testTeamId = await createTestTeam(testTeamName);
      testUserId = await createTestUser('validator@example.com', testTeamId);
      
      // Create membership for user in team with OWNER role
      testMembershipId = await createTestMembership(testUserId, testTeamId, 'OWNER');
      
      // Create test app
      testAppId = await createTestApp('Test App for Localisation', testTeamId);
      
      // Create test app metadata with supported languages
      const metadata = await createTestAppMetadata(
        testAppId, 
        'Test App for Localisation', 
        'awaiting_review',
        undefined,
        ['en', 'es', 'fr'] // Supported languages
      );
      testMetadataId = metadata.id;

      // Create localisations for Spanish and French (required for validation)
      const spanishLocalisationId = await createTestLocalisation(
        testMetadataId,
        'es',
        'Aplicación de Prueba para Localización',
        'App Localización',
        'Descripción de la aplicación de prueba para localización',
        'Descripción de la aplicación de prueba para localización en español'
      );
      testLocalisationIds.push(spanishLocalisationId);

      const frenchLocalisationId = await createTestLocalisation(
        testMetadataId,
        'fr',
        'Application de Test pour Localisation',
        'App Localisation',
        'Description de l\'application de test pour localisation',
        'Description de l\'application de test pour localisation en français'
      );
      testLocalisationIds.push(frenchLocalisationId);
    });

    it('Should Successfully Validate Complete Localisations', async () => {
      const internalApiUrl = process.env.INTERNAL_API_URL;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`
      };

      const response = await axios.post(
        `${internalApiUrl}/api/hasura/validate-localisation?app_metadata_id=${testMetadataId}&team_id=${testTeamId}`,
        {
          action: {
            name: "validate_localisation"
          },
          input: {},
          session_variables: {
            "x-hasura-role": "user",
            "x-hasura-user-id": testUserId
          }
        },
        { headers }
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('Should Return Error When App Metadata ID Is Missing', async () => {
      const internalApiUrl = process.env.INTERNAL_API_URL;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`
      };

      try {
        await axios.post(
          `${internalApiUrl}/api/hasura/validate-localisation?team_id=${testTeamId}`,
          {
            action: {
              name: "validate_localisation"
            },
            input: {},
            session_variables: {
              "x-hasura-role": "user",
              "x-hasura-user-id": testUserId
            }
          },
          { headers }
        );
        fail('Expected request to fail');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.extensions.code).toBe('invalid_request');
      }
    });

    it('Should Return Error When Team ID Is Missing', async () => {
      const internalApiUrl = process.env.INTERNAL_API_URL;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`
      };

      try {
        await axios.post(
          `${internalApiUrl}/api/hasura/validate-localisation?app_metadata_id=${testMetadataId}`,
          {
            action: {
              name: "validate_localisation"
            },
            input: {},
            session_variables: {
              "x-hasura-role": "user",
              "x-hasura-user-id": testUserId
            }
          },
          { headers }
        );
        fail('Expected request to fail');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.extensions.code).toBe('invalid_request');
      }
    });

    afterAll(async () => {
      // Clean up test data
      for (const localisationId of testLocalisationIds) {
        await deleteTestLocalisation(localisationId);
      }
      await deleteTestAppMetadata(testMetadataId);
      await deleteTestApp(testAppId);
      await deleteTestMembership(testMembershipId);
      await deleteTestUser(testUserId);
      await deleteTestTeam(testTeamId);
    });
  });
}); 