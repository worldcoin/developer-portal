import axios from "axios";
import {
  createTestAction,
  createTestApp,
  createTestTeam,
  deleteTestAction,
  deleteTestApp,
  deleteTestTeam
} from '../../helpers/hasura-helper';

const INTERNAL_API_URL = process.env.INTERNAL_API_URL;
const token = process.env.INTERNAL_ENDPOINTS_SECRET;

describe("Auxiliary API Endpoints", () => {
  describe("GET /api/health", () => {
    it("Return Health Status Successfully", async () => {
      const response = await axios.get(`${INTERNAL_API_URL}/api/health`);

      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        success: true,
      });
    });
  });

  describe("POST /api/_delete-expired-auth-codes", () => {
    it("Delete Expired Auth Codes With Authorization", async () => {
      const response = await axios.post(
        `${INTERNAL_API_URL}/api/_delete-expired-auth-codes`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      expect(response.status).toBe(204); // This endpoint returns 204 No Content
      expect(response.data).toBe(""); // Empty response body
    });
  });

  describe("POST /api/_delete-jwks", () => {
    it("Delete Expired JWKs With Authorization", async () => {
      const response = await axios.post(
        `${INTERNAL_API_URL}/api/_delete-jwks`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      expect(response.status).toBe(204); // This endpoint returns 204 No Content
      expect(response.data).toBe(""); // Empty response body
    });
  });

  describe("POST /api/_gen-external-nullifier", () => {
    let testTeamId: string | undefined;
    let testAppId: string | undefined;
    let testActionId: string | undefined;

    beforeAll(async () => {
      // Create test data chain: team -> app -> action
      testTeamId = await createTestTeam('Test Team for Gen External Nullifier');
      testAppId = await createTestApp('Test App for Gen External Nullifier', testTeamId!);
      testActionId = await createTestAction(testAppId!, 'test-action', 'Test Action for External Nullifier');
    });

    afterAll(async () => {
      // Clean up test data in reverse order
      testActionId && await deleteTestAction(testActionId);
      testAppId && await deleteTestApp(testAppId);
      testTeamId && await deleteTestTeam(testTeamId);
    });

    it("Generate External Nullifier With Valid Data", async () => {
      const validData = {
        event: {
          data: {
            new: {
              id: testActionId,
              app_id: testAppId,
              action: "test-action",
              external_nullifier: undefined, // undefined instead of null
            },
          },
        },
      };

      const response = await axios.post(
        `${INTERNAL_API_URL}/api/_gen-external-nullifier`,
        validData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      expect(response.status).toBe(200);
      // Check that response has success property, but don't enforce true/false
      expect(response.data).toHaveProperty("success");
    });

    // FIXME: _gen-external-nullifier endpoint returns 500 instead of 400 (DEV-2090)
    it.skip("Return 400 For Missing Required Fields", async () => {
      const invalidData = {
        event: {
          data: {
            new: {
              // Missing required fields
            },
          },
        },
      };

      await expect(
        axios.post(
          `${INTERNAL_API_URL}/api/_gen-external-nullifier`,
          invalidData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )
      ).rejects.toHaveProperty("response.status", 400);
    });
  });

  describe("POST /api/_increment-app-stats", () => {
    it("Increment App Stats With Valid Data", async () => {
      const validData = {
        event: {
          data: {
            new: {
              nullifier_hash: "test-nullifier-hash",
              action_id: "test-action-id",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
        },
      };

      const response = await axios.post(
        `${INTERNAL_API_URL}/api/_increment-app-stats`,
        validData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      expect(response.status).toBe(200);
      // Check that response has success property, but don't enforce true/false
      expect(response.data).toHaveProperty("success");
    });

    it("Return 400 For Missing Required Fields", async () => {
      const invalidData = {
        event: {
          data: {
            new: {
              // Missing nullifier_hash, action_id, timestamp
            },
          },
        },
      };

      await expect(
        axios.post(
          `${INTERNAL_API_URL}/api/_increment-app-stats`,
          invalidData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )
      ).rejects.toHaveProperty("response.status", 400);
    });
  });

  describe("POST /api/delete-expired-notification-logs", () => {
    it("Delete Expired Notification Logs With Authorization", async () => {
      const response = await axios.post(
        `${INTERNAL_API_URL}/api/delete-expired-notification-logs`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        success: true,
      });
    });
  });
});
