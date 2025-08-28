import axios from "axios";
import {
  createTestMembership,
  createTestTeam,
  createTestUser,
  deleteTestMembership,
  deleteTestTeam,
  deleteTestUser,
} from "helpers";

describe("Hasura API - Invite Team Members", () => {
  describe("POST /api/hasura/invite-team-members", () => {
    let testTeamId: string;
    let testUserId: string;
    let testMembershipId: string;
    let testTeamName: string = "Test Team for Invites";

    // Environment variables
    const internalApiUrl = process.env.INTERNAL_API_URL;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`,
    };

    beforeAll(async () => {
      // Create test team and user
      testTeamId = await createTestTeam(testTeamName);
      testUserId = await createTestUser("inviter@example.com", testTeamId);

      // Create membership for user in team with OWNER role (required for inviting)
      testMembershipId = await createTestMembership(
        testUserId,
        testTeamId,
        "OWNER"
      );
    });

    it("Invite New Team Members Successfully", async () => {
      const emailsToInvite = [
        "newmember1@example.com",
        "newmember2@example.com",
      ];

      const response = await axios.post(
        `${internalApiUrl}/api/hasura/invite-team-members`,
        {
          action: {
            name: "invite_team_members",
          },
          input: {
            team_id: testTeamId,
            emails: emailsToInvite,
          },
          session_variables: {
            "x-hasura-role": "user",
            "x-hasura-user-id": testUserId,
          },
        },
        { headers }
      );

      expect(response.status).toBe(200);
      expect(response.data.emails).toEqual(emailsToInvite);
    });

    it("Return Error When Inviting Existing Team Members", async () => {
      // Create another user and add them to the team
      const existingEmail = `existing_${Date.now()}@example.com`;
      const existingUserId = await createTestUser(existingEmail, testTeamId);
      await createTestMembership(existingUserId, testTeamId, "MEMBER");

      const emailsToInvite = [existingEmail];

      await expect(
        axios.post(
          `${internalApiUrl}/api/hasura/invite-team-members`,
          {
            action: {
              name: "invite_team_members",
            },
            input: {
              team_id: testTeamId,
              emails: emailsToInvite,
            },
            session_variables: {
              "x-hasura-role": "user",
              "x-hasura-user-id": testUserId,
            },
          },
          { headers }
        )
      ).rejects.toMatchObject({
        response: {
          status: 400,
          data: {
            extensions: {
              code: "already_in_team",
            },
          },
        },
      });

      // Clean up
      await deleteTestUser(existingUserId);
    });

    it("Return Error When User Has Insufficient Permissions", async () => {
      // Create a user without team membership
      const unauthorizedUserId = await createTestUser(
        `unauthorized_${Date.now()}@example.com`,
        testTeamId
      );

      const emailsToInvite = ["newmember@example.com"];

      await expect(
        axios.post(
          `${internalApiUrl}/api/hasura/invite-team-members`,
          {
            action: {
              name: "invite_team_members",
            },
            input: {
              team_id: testTeamId,
              emails: emailsToInvite,
            },
            session_variables: {
              "x-hasura-role": "user",
              "x-hasura-user-id": unauthorizedUserId,
            },
          },
          { headers }
        )
      ).rejects.toMatchObject({
        response: {
          status: 400,
          data: {
            extensions: {
              code: "insufficient_permissions",
            },
          },
        },
      });

      // Clean up
      await deleteTestUser(unauthorizedUserId);
    });

    it("Return Error When Admin Role Is Used", async () => {
      const emailsToInvite = ["newmember@example.com"];

      await expect(
        axios.post(
          `${internalApiUrl}/api/hasura/invite-team-members`,
          {
            action: {
              name: "invite_team_members",
            },
            input: {
              team_id: testTeamId,
              emails: emailsToInvite,
            },
            session_variables: {
              "x-hasura-role": "admin",
              "x-hasura-user-id": testUserId,
            },
          },
          { headers }
        )
      ).rejects.toMatchObject({
        response: {
          status: 400,
        },
      });
    });

    afterAll(async () => {
      // Clean up test data
      await deleteTestMembership(testMembershipId);
      await deleteTestUser(testUserId);
      await deleteTestTeam(testTeamId);
    });
  });
});
