import { gql } from "@apollo/client";

import { integrationDBClean, integrationDBExecuteQuery } from "./setup";

import { handleSecretReset } from "@/legacy/api/_reset-client-secret";
import { NextApiRequest, NextApiResponse } from "next";
import { createMocks } from "node-mocks-http";
import { getAPIClient, getAPIUserClient } from "./test-utils";
// TODO: Consider moving this to a generalized jest environment
beforeEach(integrationDBClean);

describe("user role", () => {
  test("can select all apps in the team", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."team"`,
    )) as { rows: Array<{ id: string }> };

    for (const team of teams) {
      const { rows: teamApps } = (await integrationDBExecuteQuery(
        `SELECT id FROM "public"."app" WHERE "team_id" = '${team.id}';`,
      )) as { rows: Array<{ id: string }> };

      const { rows: teamMemberships } = (await integrationDBExecuteQuery(
        `SELECT id, user_id FROM "public"."membership" WHERE "team_id" = '${team.id}' limit 1;`,
      )) as { rows: Array<{ id: string; user_id: string }> };

      const client = await getAPIUserClient({
        user_id: teamMemberships[0].user_id,
      });

      const query = gql(`query ListApps {
        app(order_by: {created_at: asc}) {
          id
          team_id
        }
      }`);

      const response = await client.query({ query });
      expect(response.data.app.length).toEqual(teamApps.length);

      response.data.app.forEach((app: { id: string; team_id: string }) => {
        expect(app.team_id).toEqual(team.id);
        expect(teamApps.map((app) => app.id)).toContain(app.id);
      });
    }
  });

  test("cannot see another team's apps", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."team"`,
    )) as { rows: Array<{ id: string }> };
    const team = teams[0];
    const secondTeam = teams[1];
    const { rows: user } = (await integrationDBExecuteQuery(
      `SELECT id, user_id FROM "public"."membership" WHERE "team_id" = '${team.id}' limit 1;`,
    )) as { rows: Array<{ id: string; user_id: string }> };

    const client = await getAPIUserClient({
      user_id: user[0].user_id,
    });

    const query = gql(`query ListApps {
        app(order_by: {created_at: asc}, where: {team_id: {_eq: "${secondTeam.id}"}}) {
          id
          team_id
        }
      }`);

    const response = await client.query({ query });
    expect(response.data.app.length).toEqual(0);
  });

  // NOTE: making any update mutation to the apps in the team that are different from the token team
  test("cannot update another team apps", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."team";`,
    )) as { rows: Array<{ id: string }> };

    // NOTE: Record<team_id, member>
    const users: Record<
      string,
      { id: string; user_id: string; team_id: string }
    > = {};

    for (const team of teams) {
      const { rows: fetchedUsers } = (await integrationDBExecuteQuery(
        `SELECT id, user_id, team_id FROM "public"."membership" WHERE "team_id" = '${team.id}' limit 1;`,
      )) as { rows: Array<{ id: string; user_id: string; team_id: string }> };

      users[team.id] = fetchedUsers[0];
    }

    Object.entries(users).forEach(async ([teamId, user]) => {
      const client = await getAPIUserClient({
        user_id: user.user_id,
      });

      const query = gql(`mutation UpdateApp($team_id: String!) {
        update_app(_set: {is_archived: true}, where: {team_id: {_eq: $team_id}}) {
          affected_rows
        }
      }
      `);

      const response = await client.mutate({
        mutation: query,

        variables: {
          team_id: teams.find((t) => t.id !== teamId)?.id,
        },
      });

      expect(response.data.update_app.affected_rows).toEqual(0);
    });
  });

  test("cannot delete another team apps", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."team";`,
    )) as { rows: Array<{ id: string }> };

    // NOTE: Record<team_id, member>
    const users: Record<
      string,
      { id: string; user_id: string; team_id: string }
    > = {};

    for (const team of teams) {
      const { rows: fetchedUsers } = (await integrationDBExecuteQuery(
        `SELECT id, user_id, team_id FROM "public"."membership" WHERE "team_id" = '${team.id}' limit 1;`,
      )) as { rows: Array<{ id: string; user_id: string; team_id: string }> };

      users[team.id] = fetchedUsers[0];
    }

    Object.entries(users).forEach(async ([teamId, user]) => {
      const client = await getAPIUserClient({
        user_id: user.user_id,
      });

      const query = gql(`mutation DeleteApp($team_id: String!) {
          delete_app(where: {team_id: {_eq: $team_id}}) {
            affected_rows
          }
        }
        `);

      const response = await client.mutate({
        mutation: query,

        variables: {
          team_id: teams.find((t) => t.id !== teamId)?.id,
        },
      });

      expect(response.data.delete_app.affected_rows).toEqual(0);
    });
  });

  test("cannot reset client secret as a member", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."team";`,
    )) as { rows: Array<{ id: string }> };

    const { rows: teamMemberships } = (await integrationDBExecuteQuery(
      `SELECT id, user_id, team_id FROM "public"."membership" WHERE "team_id" = '${teams[0].id}' AND "role" = 'MEMBER' limit 1;`,
    )) as { rows: Array<{ id: string; user_id: string; team_id: string }> };

    const { rows: teamApps } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."app" WHERE "team_id" = '${teams[0].id}' limit 1;`,
    )) as { rows: Array<{ id: string }> };

    // Test invalid role
    const tokenTeamId = teams[0].id;
    const tokenUserId = teamMemberships[0].user_id;
    const appId = teamApps[0].id;

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: {
        authorization: process.env.INTERNAL_ENDPOINTS_SECRET,
      },
      body: {
        input: { app_id: appId, team_id: tokenTeamId },
        action: { name: "reset_client_secret" },
        session_variables: {
          "x-hasura-role": "user",
          "x-hasura-user-id": tokenUserId,
        },
      },
    });

    await handleSecretReset(req, res);

    const responseData = res._getData();
    const responseJSON = JSON.parse(responseData);
    expect(responseJSON.extensions.code).toBe("insufficient_permissions");
  });

  test("cannot reset client secret for another team", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."team";`,
    )) as { rows: Array<{ id: string }> };

    const { rows: teamMemberships } = (await integrationDBExecuteQuery(
      `SELECT id, user_id, team_id FROM "public"."membership" WHERE "team_id" = '${teams[1].id}' AND "role" = 'OWNER' limit 1;`,
    )) as { rows: Array<{ id: string; user_id: string; team_id: string }> };

    const { rows: teamApps } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."app" WHERE "team_id" = '${teams[0].id}' limit 1;`,
    )) as { rows: Array<{ id: string }> };

    const tokenTeamId = teams[1].id;
    const tokenUserId = teamMemberships[0].user_id;
    const appId = teamApps[0].id;

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",

      headers: {
        authorization: process.env.INTERNAL_ENDPOINTS_SECRET,
      },

      body: {
        input: { app_id: appId, team_id: tokenTeamId },
        action: { name: "reset_client_secret" },
        session_variables: {
          "x-hasura-role": "user",
          "x-hasura-user-id": tokenUserId,
        },
      },
    });

    await handleSecretReset(req, res);

    const responseData = res._getData();
    const responseJSON = JSON.parse(responseData);
    expect(responseJSON.extensions.code).toBe("insufficient_permissions");
  });

  test("can reset client secret", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."team";`,
    )) as { rows: Array<{ id: string }> };

    const { rows: teamMemberships } = (await integrationDBExecuteQuery(
      `SELECT id, user_id, team_id FROM "public"."membership" WHERE "team_id" = '${teams[0].id}' AND "role" = 'OWNER' limit 1;`,
    )) as { rows: Array<{ id: string; user_id: string; team_id: string }> };

    const { rows: teamApps } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."app" WHERE "team_id" = '${teams[0].id}' limit 1;`,
    )) as { rows: Array<{ id: string }> };

    const tokenTeamId = teams[0].id;
    const tokenUserId = teamMemberships[0].user_id;
    const appId = teamApps[0].id;

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: {
        authorization: process.env.INTERNAL_ENDPOINTS_SECRET,
      },
      body: {
        input: { app_id: appId, team_id: tokenTeamId },
        action: { name: "reset_client_secret" },
        session_variables: {
          "x-hasura-role": "user",
          "x-hasura-user-id": tokenUserId,
        },
      },
    });

    await handleSecretReset(req, res);

    const responseData = res._getData();
    const responseJSON = JSON.parse(responseData);
    expect(responseJSON.client_secret).toBeDefined();
  });
});

describe("api_key role", () => {
  test("API Key: cannot select another team's apps", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."team"`,
    )) as { rows: Array<{ id: string }> };

    for (const team of teams) {
      const { rows: teamApps } = (await integrationDBExecuteQuery(
        `SELECT id FROM "public"."app" WHERE "team_id" = '${team.id}';`,
      )) as { rows: Array<{ id: string }> };

      const query = gql`
        query ListApps {
          app {
            id
            team_id
          }
        }
      `;
      const client = await getAPIClient({ team_id: team.id });
      const response = await client.query({ query });
      expect(response.data.app.length).toEqual(teamApps.length);
      response.data.app.forEach((app: { id: string; team_id: string }) => {
        expect(app.team_id).toEqual(team.id);
        expect(teamApps.map((app) => app.id)).toContain(app.id);
      });
    }
  });

  test("API Key: cannot update another team apps", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."team";`,
    )) as { rows: Array<{ id: string }> };

    const { rows: teamMemberships } = (await integrationDBExecuteQuery(
      `SELECT id, user_id, team_id FROM "public"."membership" WHERE "team_id" = '${teams[0].id}' limit 1;`,
    )) as { rows: Array<{ id: string; user_id: string; team_id: string }> };

    const tokenTeamId = teamMemberships[0].team_id;

    const client = await getAPIClient({ team_id: tokenTeamId });
    const mutation = gql`
      mutation UpdateApp($team_id: String!) {
        update_app(
          _set: { is_archived: true }
          where: { team_id: { _eq: $team_id } }
        ) {
          affected_rows
        }
      }
    `;
    const response = await client.mutate({
      mutation,
      variables: { team_id: teams.find((t) => t.id !== tokenTeamId)?.id },
    });

    expect(response.data.update_app.affected_rows).toEqual(0);
  });
  test("API Key: cannot delete another team's apps", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."team";`,
    )) as { rows: Array<{ id: string }> };

    const { rows: teamMemberships } = (await integrationDBExecuteQuery(
      `SELECT id, user_id, team_id FROM "public"."membership" WHERE "team_id" = '${teams[0].id}' limit 1;`,
    )) as { rows: Array<{ id: string; user_id: string; team_id: string }> };

    const tokenTeamId = teamMemberships[0].team_id;

    const client = await getAPIClient({ team_id: tokenTeamId });
    const mutation = gql`
      mutation DeleteApp($team_id: String!) {
        delete_app(where: { team_id: { _eq: $team_id } }) {
          affected_rows
        }
      }
    `;
    const response = await client.mutate({
      mutation,
      variables: { team_id: teams.find((t) => t.id !== tokenTeamId)?.id },
    });
    expect(response.data.delete_app.affected_rows).toEqual(0);
  });
});
