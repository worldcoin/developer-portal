import { gql } from "@apollo/client";

import {
  integrationDBExecuteQuery,
  integrationDBSetup,
  integrationDBTearDown,
} from "./setup";

import { getAPIUserClient } from "./test-utils";

// TODO: Consider moving this to a generalized jest environment
beforeEach(integrationDBSetup);
beforeEach(integrationDBTearDown);

describe("user role", () => {
  test("cannot select another team apps", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."team"`
    )) as { rows: Array<{ id: string }> };

    for (const team of teams) {
      const { rows: teamApps } = (await integrationDBExecuteQuery(
        `SELECT id FROM "public"."app" WHERE "team_id" = '${team.id}';`
      )) as { rows: Array<{ id: string }> };

      const { rows: teamMemberships } = (await integrationDBExecuteQuery(
        `SELECT id, user_id FROM "public"."membership" WHERE "team_id" = '${team.id}' limit 1;`
      )) as { rows: Array<{ id: string; user_id: string }> };

      const client = await getAPIUserClient({
        team_id: team.id,
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

  // NOTE: making any update mutation to the apps in the team that are different from the token team
  test("cannot update another team apps", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."team";`
    )) as { rows: Array<{ id: string }> };

    const { rows: teamMemberships } = (await integrationDBExecuteQuery(
      `SELECT id, user_id, team_id FROM "public"."membership" WHERE "team_id" = '${teams[0].id}' limit 1;`
    )) as { rows: Array<{ id: string; user_id: string; team_id: string }> };

    const tokenUserId = teamMemberships[0].user_id;
    const tokenTeamId = teamMemberships[0].team_id;

    const client = await getAPIUserClient({
      user_id: tokenUserId,
      team_id: tokenTeamId,
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
        team_id: teams.find((t) => t.id !== tokenTeamId)?.id,
      },
    });

    expect(response.data.update_app.affected_rows).toEqual(0);
  });

  test("cannot delete another team apps", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."team";`
    )) as { rows: Array<{ id: string }> };

    const { rows: teamMemberships } = (await integrationDBExecuteQuery(
      `SELECT id, user_id, team_id FROM "public"."membership" WHERE "team_id" = '${teams[0].id}' limit 1;`
    )) as { rows: Array<{ id: string; user_id: string; team_id: string }> };

    const tokenUserId = teamMemberships[0].user_id;
    const tokenTeamId = teamMemberships[0].team_id;

    const client = await getAPIUserClient({
      user_id: tokenUserId,
      team_id: tokenTeamId,
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
        team_id: teams.find((t) => t.id !== tokenTeamId)?.id,
      },
    });

    expect(response.data.delete_app.affected_rows).toEqual(0);
  });
});
