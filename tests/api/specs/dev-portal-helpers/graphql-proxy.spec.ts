import axios from "axios";
import {
  createTestApiKey,
  createTestApp,
  createTestTeam,
  createTestUser,
  deleteTestApiKey,
  deleteTestApp,
  deleteTestTeam,
  deleteTestUser,
} from "helpers";
import { createAppSession } from "helpers/auth0";

const INTERNAL_API_URL = process.env.INTERNAL_API_URL;
const INTERNAL_ENDPOINTS_SECRET = process.env.INTERNAL_ENDPOINTS_SECRET;
const NAME_SLUG = process.env.NAME_SLUG;

describe("Dev Portal Helpers API Endpoints", () => {
  describe("POST /api/v1/graphql", () => {
    let cleanUpFunctions: Array<() => Promise<unknown>> = [];

    afterEach(async () => {
      await cleanUpFunctions.reduce<Promise<unknown>>(
        (promise, callback) => promise.then(() => callback()),
        Promise.resolve(),
      );

      cleanUpFunctions = [];
    });

    describe("API Key Authentication", () => {
      it("Should authenticate with API key and proxy GraphQL request", async () => {
        // Setup test data
        const teamId = await createTestTeam("Test Team GraphQL");
        cleanUpFunctions.push(async () => await deleteTestTeam(teamId));

        const userEmail = `qa+${NAME_SLUG}+${Date.now()}@toolsforhumanity.com`;
        const userId = await createTestUser(userEmail, teamId);
        cleanUpFunctions.push(async () => await deleteTestUser(userId));

        const appId = await createTestApp("Test App GraphQL", teamId);
        cleanUpFunctions.push(async () => await deleteTestApp(appId));

        // Create API key for authentication
        const { apiKeyId, apiKeyHeader } = await createTestApiKey(
          teamId,
          "Test Key for GraphQL",
        );
        cleanUpFunctions.push(async () => await deleteTestApiKey(apiKeyId));

        // Test GraphQL query - simple query to get teams
        const graphqlQuery = {
          query: `
            query GetTeams {
              team(limit: 1) {
                id
              }
            }
          `,
        };

        const response = await axios.post(
          `${INTERNAL_API_URL}/api/v1/graphql`,
          graphqlQuery,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKeyHeader}`,
            },
          },
        );

        expect(response.status).toBe(200);
        const returnedTeamIds = response.data.data.team.map(
          (team: any) => team.id,
        );
        expect(returnedTeamIds).toContain(teamId);
      });
    });

    describe("Auth0 Session Authentication", () => {
      it("Should authenticate with Auth0 session cookie and proxy GraphQL request", async () => {
        // Setup test data for Auth0 user
        const teamId = await createTestTeam("Test Team Auth0 GraphQL");
        cleanUpFunctions.push(async () => await deleteTestTeam(teamId));

        const userEmail = `qa+${NAME_SLUG}+${Date.now()}@toolsforhumanity.com`;
        const userId = await createTestUser(userEmail, teamId);
        cleanUpFunctions.push(async () => await deleteTestUser(userId));

        // Create Auth0 session
        const mockAuth0Session = {
          user: {
            sub: `auth0|test_${Date.now()}`,
            hasura: {
              id: userId,
            },
          },
        };

        const sessionCookie = await createAppSession(mockAuth0Session);

        // Test GraphQL query with Auth0 session
        const graphqlQuery = {
          query: `
            query GetUser($userId: String!) {
              user_by_pk(id: $userId) {
                id
                email
              }
            }
          `,
          variables: {
            userId: userId,
          },
        };

        const response = await axios.post(
          `${INTERNAL_API_URL}/api/v1/graphql`,
          graphqlQuery,
          {
            headers: {
              "Content-Type": "application/json",
              Cookie: sessionCookie,
            },
          },
        );

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty("data");
        expect(response.data.data).toHaveProperty("user_by_pk");
        expect(response.data.data.user_by_pk).toMatchObject({
          id: userId,
          email: userEmail,
        });
      });
    });
  });
});
