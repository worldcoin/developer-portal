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

    beforeAll(async () => {
      // Create test team and user
      testTeamId = await createTestTeam(testTeamName);
      testUserId = await createTestUser('uploader@example.com', testTeamId);
      
      // Create membership for user in team with OWNER role (required for upload)
      testMembershipId = await createTestMembership(testUserId, testTeamId, 'OWNER');
      
      // Create test app
      testAppId = await createTestApp('Test App for Image Upload', testTeamId);
    });

    it('Should Successfully Generate Presigned URL for PNG Image', async () => {
      const internalApiUrl = process.env.INTERNAL_API_URL;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`
      };

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

    it('Should Successfully Generate Presigned URL for JPEG Image', async () => {
      const internalApiUrl = process.env.INTERNAL_API_URL;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`
      };

      const response = await axios.post(
        `${internalApiUrl}/api/hasura/upload-image?app_id=${testAppId}&image_type=hero&content_type_ending=jpeg`,
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

    it('Should Successfully Generate Presigned URL with Locale', async () => {
      const internalApiUrl = process.env.INTERNAL_API_URL;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`
      };

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

    it('Should Return Error When Invalid Action Name', async () => {
      const internalApiUrl = process.env.INTERNAL_API_URL;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`
      };

      try {
        await axios.post(
          `${internalApiUrl}/api/hasura/upload-image?app_id=${testAppId}&image_type=logo&content_type_ending=png`,
          {
            action: {
              name: "invalid_action"
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
        fail('Expected request to fail');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.extensions.code).toBe('invalid_action');
      }
    });

    it('Should Return Error When Invalid Content Type', async () => {
      const internalApiUrl = process.env.INTERNAL_API_URL;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`
      };

      try {
        await axios.post(
          `${internalApiUrl}/api/hasura/upload-image?app_id=${testAppId}&image_type=logo&content_type_ending=gif`,
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
        fail('Expected request to fail');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.extensions.code).toBe('invalid_input');
      }
    });

    it('Should Return Error When App Not Found', async () => {
      const internalApiUrl = process.env.INTERNAL_API_URL;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`
      };

      const nonExistentAppId = 'app_nonexistent123';

      try {
        await axios.post(
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
        );
        fail('Expected request to fail');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.extensions.code).toBe('not_found');
      }
    });

    it('Should Return Error When User Has Insufficient Permissions', async () => {
      const internalApiUrl = process.env.INTERNAL_API_URL;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`
      };

      // Create a user without proper team membership
      const unauthorizedUserId = await createTestUser(`unauthorized_${Date.now()}@example.com`, testTeamId);

      try {
        await axios.post(
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
        );
        fail('Expected request to fail');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.extensions.code).toBe('not_found');
      }

      // Clean up
      await deleteTestUser(unauthorizedUserId);
    });

    it('Should Return Error When Missing Required Parameters', async () => {
      const internalApiUrl = process.env.INTERNAL_API_URL;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`
      };

      try {
        await axios.post(
          `${internalApiUrl}/api/hasura/upload-image?image_type=logo&content_type_ending=png`,
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
        fail('Expected request to fail');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.extensions.code).toBe('invalid_request');
      }
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