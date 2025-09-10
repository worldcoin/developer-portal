import axios from 'axios';
import crypto from 'crypto';
import { adminGraphqlClient, createTestApp, createTestTeam, createTestUser, deleteTestApiKey, deleteTestApp, deleteTestTeam, deleteTestUser } from '../../helpers/hasura';

const INTERNAL_API_URL = process.env.INTERNAL_API_URL;

// Enhanced version of createTestApiKey that generates real credentials
const createTestApiKeyWithCredentials = async (teamId: string, name: string = "Test API Key") => {
  const GENERAL_SECRET_KEY = process.env.GENERAL_SECRET_KEY;
  if (!GENERAL_SECRET_KEY) {
    throw new Error("GENERAL_SECRET_KEY env var must be set for tests");
  }
  
  // Step 1: Create API key record to get UUID 
  const createMutation = `
    mutation CreateApiKey($object: api_key_insert_input!) {
      insert_api_key_one(object: $object) {
        id
      }
    }
  `;
  
  // First create with temporary hash to get UUID
  const createResponse = (await adminGraphqlClient.request(createMutation, {
    object: {
      team_id: teamId,
      api_key: "temp_hash",
      name,
      is_active: true
    }
  })) as any;
  
  const uuid_id = createResponse.insert_api_key_one?.id;
  if (!uuid_id) {
    throw new Error("Failed to create API key record");
  }
  
  // Step 2: Generate real secret and hash using UUID as key_id
  const secret = `sk_${crypto.randomBytes(24).toString("hex")}`;
  const hmac = crypto.createHmac("sha256", GENERAL_SECRET_KEY);
  hmac.update(`${uuid_id}.${secret}`);
  const hashed_secret = hmac.digest("hex");
  
  // Step 3: Update with real hash
  const updateMutation = `
    mutation UpdateApiKey($id: String!, $api_key: String!) {
      update_api_key_by_pk(pk_columns: {id: $id}, _set: {api_key: $api_key}) {
        id
      }
    }
  `;
  
  await adminGraphqlClient.request(updateMutation, {
    id: uuid_id,
    api_key: hashed_secret
  });
  
  // Step 4: Create proper API key header format for HTTP auth
  const credentials = `${uuid_id}:${secret}`;
  const encodedCredentials = Buffer.from(credentials).toString('base64');
  const apiKeyHeader = `api_${encodedCredentials}`;
  
  return {
    apiKeyId: uuid_id,
    secret,
    apiKeyHeader
  };
};


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
