import axios from 'axios';
import { createTestApp, createTestTeam, deleteTestApp, deleteTestTeam, getAppById } from '../../helpers/hasura-setup';

describe('Hasura API Endpoints', () => {
  describe('POST /api/hasura/ban-app and /api/hasura/unban-app', () => {
    let testAppId: string;
    let testTeamId: string;
    let testTeamName: string = 'Test Team for App Management';

    beforeAll(async () => {
      // Create test app
      testTeamId = await createTestTeam(testTeamName);
      testAppId = await createTestApp('Test App for Ban/Unban', testTeamId);
    });

    it('Ban And Then Unban An App Successfully', async () => {
      const internalApiUrl = process.env.INTERNAL_API_URL;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`
      };

      // Step 1: Verify app is not banned initially
      const appInitial = await getAppById(testAppId);
      expect(appInitial.is_banned).toBe(false);

      // Step 2: Ban the app
      const banResponse = await axios.post(
        `${internalApiUrl}/api/hasura/ban-app`,
        {
          action: {
            name: "ban_app"
          },
          input: {
            app_id: testAppId
          },
          session_variables: {
            "x-hasura-role": "admin"
          }
        },
        { headers }
      );

      expect(banResponse.status).toBe(200);
      expect(banResponse.data.success).toBe(true);
      
      // Verify app is now banned
      const appAfterBan = await getAppById(testAppId);
      expect(appAfterBan.is_banned).toBe(true);

      // Step 3: Unban the app
      const unbanResponse = await axios.post(
        `${internalApiUrl}/api/hasura/unban-app`,
        {
          action: {
            name: "unban_app"
          },
          input: {
            app_id: testAppId
          },
          session_variables: {
            "x-hasura-role": "admin"
          }
        },
        { headers }
      );

      expect(unbanResponse.status).toBe(200);
      expect(unbanResponse.data.success).toBe(true);
      
      // Verify app is now unbanned
      const appAfterUnban = await getAppById(testAppId);
      expect(appAfterUnban.is_banned).toBe(false);
    });

    afterAll(async () => {
      // Clean up test data
      await deleteTestApp(testAppId);
      await deleteTestTeam(testTeamId);
    });
  });
}); 