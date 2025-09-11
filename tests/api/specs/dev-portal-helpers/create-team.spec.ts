import axios from "axios";
import {
  createTestUser,
  deleteTestTeam,
  deleteTestUser,
  findUserByAuth0Id,
} from "helpers";
import { createAppSession } from "helpers/auth0";

const INTERNAL_API_URL = process.env.INTERNAL_API_URL;
const NAME_SLUG = process.env.NAME_SLUG;

describe("Dev Portal Helpers API Endpoints", () => {
  describe("POST /api/create-team", () => {
    let cleanUpFunctions: Array<() => Promise<unknown>> = [];

    afterEach(async () => {
      await cleanUpFunctions.reduce<Promise<unknown>>(
        (promise, callback) => promise.then(() => callback()),
        Promise.resolve(),
      );

      cleanUpFunctions = [];
    });

    it("Create team successfully for existing user", async () => {
      const userEmail = `qa+${NAME_SLUG}+${Date.now()}@toolsforhumanity.com`;
      const testUserId = await createTestUser(userEmail);

      // Add cleanup functions
      cleanUpFunctions.push(async () => await deleteTestUser(testUserId));

      // Generate unique auth0Id to prevent constraint violations
      const uniqueAuth0Id = `auth0|test_existing_user_${Date.now()}`;

      const existingUserSession = await createAppSession({
        user: {
          sub: uniqueAuth0Id,
          email: userEmail,
          hasura: {
            id: testUserId,
          },
        },
      });

      const teamData = {
        team_name: "Test Team for API Tests",
        hasUser: true,
      };

      const response = await axios.post(
        `${INTERNAL_API_URL}/api/create-team`,
        teamData,
        {
          headers: {
            "Content-Type": "application/json",
            Cookie: existingUserSession,
          },
        },
      );

      expect(
        response.status,
        `Create team request resolved with a wrong code:\n${JSON.stringify(response.data, null, 2)}`,
      ).toBe(200);

      expect(response.data).toEqual(
        expect.objectContaining({
          returnTo: expect.stringMatching(/^\/teams\/team_[a-f0-9]{32}$/),
        }),
      );

      // Extract team_id from returnTo URL for cleanup
      const createdTeamId = response.data.returnTo.split("/teams/")[1];
      cleanUpFunctions.push(async () => await deleteTestTeam(createdTeamId));
    });

    it("Create an initial team along with the user", async () => {
      const userEmail = `qa+${NAME_SLUG}+${Date.now()}@toolsforhumanity.com`;
      const teamData = {
        team_name: "Test Team for New User",
        hasUser: false,
      };

      // Generate unique auth0Id to prevent constraint violations
      const uniqueAuth0Id = `auth0|test_new_user_${Date.now()}`;

      const auth0Session = {
        user: {
          sub: uniqueAuth0Id,
          email: userEmail,
          hasura: {
            id: `test_hasura_user_id_${Date.now()}`,
          },
        },
      };

      const sessionCookie = await createAppSession(auth0Session);

      const response = await axios.post(
        `${INTERNAL_API_URL}/api/create-team`,
        teamData,
        {
          headers: {
            "Content-Type": "application/json",
            Cookie: sessionCookie,
          },
        },
      );

      expect(
        response.status,
        `Create team request resolved with a wrong code:\n${JSON.stringify(response.data, null, 2)}`,
      ).toBe(200);
      expect(response.data).toEqual(
        expect.objectContaining({
          returnTo: expect.stringMatching(
            /^\/teams\/team_[a-f0-9]{32}\/apps\/$/,
          ),
        }),
      );

      // Extract team_id from returnTo URL for cleanup
      const createdTeamId = response.data.returnTo
        .split("/teams/")[1]
        .split("/apps/")[0];
      cleanUpFunctions.push(async () => await deleteTestTeam(createdTeamId));

      // Find and cleanup the created user by auth0Id
      const createdUserId = await findUserByAuth0Id(uniqueAuth0Id);
      if (createdUserId) {
        cleanUpFunctions.push(async () => await deleteTestUser(createdUserId));
      }
    });
  });
});
