import axios from 'axios';
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
  deleteTestUser
} from '../../helpers/hasura-helper';

describe('Hasura API - Reset Client Secret', () => {
  describe('POST /api/hasura/reset-client-secret', () => {
    let testAppId: string | undefined;
    let testTeamId: string | undefined;
    let testUserId: string | undefined;
    let testMembershipId: string | undefined;
    let testMetadataId: string | undefined;
    let testTeamName: string = 'Test Team for Reset Client Secret';
    
    // Environment variables
    const internalApiUrl = process.env.INTERNAL_API_URL;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`
    };

    beforeAll(async () => {
      // Create test team and user
      testTeamId = await createTestTeam(testTeamName);
      testUserId = await createTestUser(`resetclient_${Date.now()}@example.com`, testTeamId!);
      
      // Create membership for user in team with OWNER role
      testMembershipId = await createTestMembership(testUserId!, testTeamId!, 'OWNER');
      
      // Create test app
      testAppId = await createTestApp('Test App for Reset Client Secret', testTeamId!);
      
      // Create test app metadata
      const metadata = await createTestAppMetadata(
        testAppId!, 
        'Test App for Reset Client Secret', 
        'unverified',
        ['showcase_img_1.jpg'],
        ['en']
      );
      testMetadataId = metadata.id;
    });

    it('Reset Client Secret Successfully', async () => {
      const response = await axios.post(
        `${internalApiUrl}/api/hasura/reset-client-secret`,
        {
          action: {
            name: "reset_client_secret"
          },
          input: {
            team_id: testTeamId,
            app_id: testAppId
          },
          session_variables: {
            "x-hasura-role": "user",
            "x-hasura-user-id": testUserId
          }
        },
        { headers }
      );

      expect(response.status).toBe(200);
      expect(response.data.client_secret).toBeDefined();
      expect(typeof response.data.client_secret).toBe('string');
    });
    
    afterAll(async () => {
      // Clean up test data
      testMetadataId && await deleteTestAppMetadata(testMetadataId);
      testAppId && await deleteTestApp(testAppId);
      testMembershipId && await deleteTestMembership(testMembershipId);
      testUserId && await deleteTestUser(testUserId);
      testTeamId && await deleteTestTeam(testTeamId);
    });
  });
});
