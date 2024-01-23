import { gql } from "@apollo/client";

import {
  integrationDBExecuteQuery,
  integrationDBSetup,
  integrationDBTearDown,
} from "./setup";

import { getAPIUserClient } from "./test-utils";
import { generateAPIKeyJWT } from "@/backend/jwts";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
// TODO: Consider moving this to a generalized jest environment
beforeEach(integrationDBSetup);
beforeEach(integrationDBTearDown);

describe("user role", () => {
  test("cannot select another team's apps", async () => {
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
    // Use an incorrect team
    const { rows: teamMemberships } = (await integrationDBExecuteQuery(
      `SELECT id, user_id FROM "public"."membership" WHERE "team_id" = '${teams[1].id}' limit 1;`
    )) as { rows: Array<{ id: string; user_id: string }> };
    const client = await getAPIUserClient({
      team_id: teams[0].id,
      user_id: teamMemberships[0].user_id,
    });

    const query = gql(`query ListApps {
      app(order_by: {created_at: asc}) {
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

    // Test invalid team
    const { rows: testInvalidTeamMemberships } =
      (await integrationDBExecuteQuery(
        `SELECT id, user_id, team_id FROM "public"."membership" WHERE "team_id" = '${teams[1].id}' limit 1;`
      )) as { rows: Array<{ id: string; user_id: string; team_id: string }> };
    const testInvalidTokenTeamId = testInvalidTeamMemberships[0].team_id;

    const testInvalidClient = await getAPIUserClient({
      user_id: tokenUserId,
      team_id: testInvalidTokenTeamId,
    });

    const testInvalidResponse = await testInvalidClient.mutate({
      mutation: query,

      variables: {
        team_id: teams.find((t) => t.id !== tokenTeamId)?.id,
      },
    });
    expect(testInvalidResponse.data.update_app.affected_rows).toEqual(0);
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

    // Test invalid team
    const { rows: testInvalidTeamMemberships } =
      (await integrationDBExecuteQuery(
        `SELECT id, user_id, team_id FROM "public"."membership" WHERE "team_id" = '${teams[1].id}' limit 1;`
      )) as { rows: Array<{ id: string; user_id: string; team_id: string }> };
    const testInvalidTokenTeamId = testInvalidTeamMemberships[0].team_id;

    const testInvalidClient = await getAPIUserClient({
      user_id: tokenUserId,
      team_id: testInvalidTokenTeamId,
    });

    const testInvalidResponse = await testInvalidClient.mutate({
      mutation: query,
      variables: {
        team_id: testInvalidTokenTeamId,
      },
    });
    expect(testInvalidResponse.data.delete_app.affected_rows).toEqual(0);
  });
});

describe("api_key role", () => {
  test("API Key: cannot select another team's apps", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."team"`
    )) as { rows: Array<{ id: string }> };

    for (const team of teams) {
      const { rows: teamApps } = (await integrationDBExecuteQuery(
        `SELECT id FROM "public"."app" WHERE "team_id" = '${team.id}';`
      )) as { rows: Array<{ id: string }> };

      const apiKey = await generateAPIKeyJWT(team.id);
      const response = await fetch(
        publicRuntimeConfig.NEXT_PUBLIC_GRAPHQL_API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            query: `
            query ListApps {
              app {
                id
                team_id
              }
            }
          `,
          }),
        }
      );
      const responseData = await response.json();
      expect(responseData.data.app.length).toEqual(teamApps.length);

      responseData.data.app.forEach((app: { id: string; team_id: string }) => {
        expect(app.team_id).toEqual(team.id);
        expect(teamApps.map((app) => app.id)).toContain(app.id);
      });
    }
  });
  test("API Key: cannot update another team apps", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."team";`
    )) as { rows: Array<{ id: string }> };

    const { rows: teamMemberships } = (await integrationDBExecuteQuery(
      `SELECT id, user_id, team_id FROM "public"."membership" WHERE "team_id" = '${teams[0].id}' limit 1;`
    )) as { rows: Array<{ id: string; user_id: string; team_id: string }> };

    const tokenTeamId = teamMemberships[0].team_id;

    const apiKey = await generateAPIKeyJWT(tokenTeamId);
    const response = await fetch(
      publicRuntimeConfig.NEXT_PUBLIC_GRAPHQL_API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query: `
          mutation UpdateApp($team_id: String!) {
            update_app(_set: {is_archived: true}, where: {team_id: {_eq: $team_id}}) {
              affected_rows
            }
          }
          `,
          variables: {
            team_id: teams.find((t) => t.id !== tokenTeamId)?.id,
          },
        }),
      }
    );
    const responseData = await response.json();

    expect(responseData.data.update_app.affected_rows).toEqual(0);
  });
  test("API Key: cannot delete another team's apps", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."team";`
    )) as { rows: Array<{ id: string }> };

    const { rows: teamMemberships } = (await integrationDBExecuteQuery(
      `SELECT id, user_id, team_id FROM "public"."membership" WHERE "team_id" = '${teams[0].id}' limit 1;`
    )) as { rows: Array<{ id: string; user_id: string; team_id: string }> };

    const tokenTeamId = teamMemberships[0].team_id;

    const apiKey = await generateAPIKeyJWT(tokenTeamId);
    const response = await fetch(
      publicRuntimeConfig.NEXT_PUBLIC_GRAPHQL_API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query: `
          mutation DeleteApp($team_id: String!) {
            delete_app(where: {team_id: {_eq: $team_id}}) {
              affected_rows
            }
          }
          `,
          variables: {
            team_id: teams.find((t) => t.id !== tokenTeamId)?.id,
          },
        }),
      }
    );

    const responseData = await response.json();
    expect(responseData.data.delete_app.affected_rows).toEqual(0);
  });
});
