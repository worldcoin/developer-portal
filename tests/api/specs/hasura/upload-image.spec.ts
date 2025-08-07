import axios from 'axios';
import {
  createTestApp,
  createTestMembership,
  createTestTeam,
  createTestUser,
  deleteTestApp,
  deleteTestMembership,
  deleteTestTeam,
  deleteTestUser
} from '../../helpers/hasura-helper';

describe('Hasura API - Upload Image', () => {
  describe('POST /api/hasura/upload-image', () => {
    let testAppId: string;
    let testTeamId: string;
    let testUserId: string;
    let testMembershipId: string;
    let testTeamName: string = 'Test Team for Image Upload';
    
    // Environment variables
    const internalApiUrl = process.env.INTERNAL_API_URL;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`
    };

    beforeAll(async () => {
      // Create test team and user
      testTeamId = await createTestTeam(testTeamName);
      testUserId = await createTestUser('uploader@example.com', testTeamId);
      
      // Create membership for user in team with OWNER role (required for upload)
      testMembershipId = await createTestMembership(testUserId, testTeamId, 'OWNER');
      
      // Create test app
      testAppId = await createTestApp('Test App for Image Upload', testTeamId);
    });

    it('Generate Presigned URL for PNG Image Successfully', async () => {
      const response = await axios.post(
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

      expect(response.status).toBe(200);
      expect(response.data.url).toBeDefined();
      expect(response.data.stringifiedFields).toBeDefined();
      expect(typeof response.data.url).toBe('string');
      expect(typeof response.data.stringifiedFields).toBe('string');
    });

    it('Generate Presigned URL with Locale Successfully', async () => {
      const response = await axios.post(
        `${internalApiUrl}/api/hasura/upload-image?app_id=${testAppId}&image_type=logo&content_type_ending=png&locale=es`,
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

      expect(response.status).toBe(200);
      expect(response.data.url).toBeDefined();
      expect(response.data.stringifiedFields).toBeDefined();
    });

    it('Return Error When App Not Found', async () => {
      const nonExistentAppId = 'app_nonexistent123';

      await expect(axios.post(
        `${internalApiUrl}/api/hasura/upload-image?app_id=${nonExistentAppId}&image_type=logo&content_type_ending=png`,
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
      )).rejects.toMatchObject({
        response: {
          status: 400,
          data: {
            extensions: {
              code: 'not_found'
            }
          }
        }
      });
    });

    it('Return Error When User Has Insufficient Permissions', async () => {
      // Create a user without proper team membership
      const unauthorizedUserId = await createTestUser(`unauthorized_${Date.now()}@example.com`, testTeamId);

      await expect(axios.post(
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
            "x-hasura-user-id": unauthorizedUserId
          }
        },
        { headers }
      )).rejects.toMatchObject({
        response: {
          status: 400,
          data: {
            extensions: {
              code: 'not_found'
            }
          }
        }
      });

      // Clean up
      await deleteTestUser(unauthorizedUserId);
    });

    afterAll(async () => {
      // Clean up test data
      await deleteTestApp(testAppId);
      await deleteTestMembership(testMembershipId);
      await deleteTestUser(testUserId);
      await deleteTestTeam(testTeamId);
    });
  });
}); 