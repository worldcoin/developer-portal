import axios from 'axios';
import { createTestApiKeyWithCredentials, createTestApp, createTestTeam, createTestUser, deleteTestApiKey, deleteTestApp, deleteTestTeam, deleteTestUser } from '../../helpers/hasura';

const INTERNAL_API_URL = process.env.INTERNAL_API_URL;

describe('Dev Portal Helpers API Endpoints', () => {
  describe('POST /api/v2/create-action/[app_id]', () => {
    let cleanUpFunctions: Array<() => Promise<unknown>> = [];

    afterEach(async () => {
      await cleanUpFunctions.reduce<Promise<unknown>>(
        (promise, callback) => promise.then(() => callback()),
        Promise.resolve(),
      );

      cleanUpFunctions = [];
    });

    it('Create Action Successfully with API Key', async () => {
      // Setup test data
      const teamId = await createTestTeam('Test Team');
      cleanUpFunctions.push(async () => await deleteTestTeam(teamId));
      
      const userEmail = `testuser_${Date.now()}@example.com`;
      const userId = await createTestUser(userEmail, teamId);
      cleanUpFunctions.push(async () => await deleteTestUser(userId));

      const appId = await createTestApp('Test App', teamId);
      cleanUpFunctions.push(async () => await deleteTestApp(appId));

      // Create API key for authentication
      const { apiKeyId, apiKeyHeader } = await createTestApiKeyWithCredentials(teamId, "Test Key for Create Action");
      cleanUpFunctions.push(async () => await deleteTestApiKey(apiKeyId));

      // Test data
      const actionData = {
        action: `test_action_${Date.now()}`,
        name: 'Test Action',
        description: 'Test action description',
        max_verifications: 5
      };

      const response = await axios.post(
        `${INTERNAL_API_URL}/api/v2/create-action/${appId}`,
        actionData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKeyHeader}`
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toEqual(
        expect.objectContaining({
          action: expect.objectContaining({
            id: expect.any(String),
            action: actionData.action,
            name: actionData.name,
            description: actionData.description,
            max_verifications: actionData.max_verifications,
            external_nullifier: expect.any(String),
            status: 'active'
          })
        })
      );
    });
  });
});
