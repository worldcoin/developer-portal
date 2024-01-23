import { getAPIServiceClient } from "src/backend/graphql";
import {
  integrationDBSetup,
  integrationDBTearDown,
  integrationDBExecuteQuery,
} from "./setup";
import { getAPIUserClient } from "./test-utils";
import { gql } from "@apollo/client";
import { Role_Enum } from "@/graphql/graphql";
import getConfig from "next/config";
import { generateAPIKeyJWT } from "@/backend/jwts";
const { publicRuntimeConfig } = getConfig();

// TODO: Consider moving this to a generalized jest environment
beforeEach(integrationDBSetup);
beforeEach(integrationDBTearDown);

describe("team model", () => {
  test("verified logo is properly sent when team is verified", async () => {
    // TODO
    const client = await getAPIServiceClient();
  });
});

describe("user role", () => {
  test("only authorized roles can update team", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id, name FROM "public"."team" limit 1`
    )) as { rows: Array<{ id: string; name: string }> };

    const nameBeforeUpdate = teams[0].name;
    const team_id = teams[0].id;

    const { rows: teamMemberships } = (await integrationDBExecuteQuery(
      `SELECT id, user_id, team_id, role FROM "public"."membership" WHERE "team_id" = '${teams[0].id}'`
    )) as {
      rows: Array<{
        id: string;
        user_id: string;
        team_id: string;
        role: Role_Enum;
      }>;
    };

    const mutation = gql`
      mutation UpdateTeam($id: String!, $name: String!) {
        update_team(where: { id: { _eq: $id } }, _set: { name: $name }) {
          affected_rows
        }
      }
    `;

    for (const teamMember of teamMemberships) {
      const client = await getAPIUserClient({
        team_id: team_id,
        user_id: teamMember.user_id,
      });

      const response = await client.mutate({
        mutation,
        variables: {
          id: team_id,
          name: "new name",
        },
      });

      if (teamMember.role === Role_Enum.Owner) {
        expect(response.data?.update_team?.affected_rows).toEqual(1);

        // NOTE: revert update changes
        await integrationDBExecuteQuery(
          // update team hasura postgresql query
          `UPDATE "public"."team" SET "name" = '${nameBeforeUpdate}' WHERE "id" = '${team_id}' RETURNING "name";`
        );
      } else {
        expect(response.data?.update_team?.affected_rows).toEqual(0);
        // Additional SQL query to confirm the team name has not changed
        const { rows: unchangedTeam } = (await integrationDBExecuteQuery(
          `SELECT name FROM "public"."team" WHERE "id" = '${team_id}'`
        )) as { rows: Array<{ name: string }> };
        expect(unchangedTeam[0].name).toEqual(nameBeforeUpdate);
      }
    }
  });

  test("cannot select another team", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."team"`
    )) as { rows: Array<{ id: string }> };

    for (const team of teams) {
      const { rows: teamMemberships } = (await integrationDBExecuteQuery(
        `SELECT id, user_id FROM "public"."membership" WHERE "team_id" = '${team.id}' limit 1;`
      )) as { rows: Array<{ id: string; user_id: string }> };

      const client = await getAPIUserClient({
        team_id: team.id,
        user_id: teamMemberships[0].user_id,
      });

      const query = gql`
        query ListTeams {
          team {
            id
          }
        }
      `;

      const response = await client.query({ query });
      expect(response.data.team.length).toEqual(1);
      expect(response.data.team[0].id).toEqual(team.id);
    }
    // Test using an team that the user is not a member of
    const { rows: testInvalidTeamMemberships } =
      (await integrationDBExecuteQuery(
        `SELECT id, user_id FROM "public"."membership" WHERE "team_id" = '${teams[1].id}' limit 1;`
      )) as { rows: Array<{ id: string; user_id: string }> };

    const testInvalidClient = await getAPIUserClient({
      team_id: teams[0].id,
      user_id: testInvalidTeamMemberships[0].user_id,
    });

    const query = gql`
      query ListTeams {
        team (where: {id: {_eq: "${teams[0].id}"}}) {
          id
        }
      }
    `;

    const response = await testInvalidClient.query({ query });
    expect(response.data.team.length).toEqual(0);
  });

  test("API Key: cannot select another team", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."team"`
    )) as { rows: Array<{ id: string }> };

    for (const team of teams) {
      const response = await fetch(
        publicRuntimeConfig.NEXT_PUBLIC_GRAPHQL_API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await generateAPIKeyJWT(team.id)}`,
          },
          body: JSON.stringify({
            query: `
            query ListTeams {
              team {
                id
              }
            }
          `,
          }),
        }
      );
      const responseData = await response.json();
      expect(responseData.data.team.length).toEqual(1);
      expect(responseData.data.team[0].id).toEqual(team.id);
    }
  });

  test("cannot update another team", async () => {
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

    const query = gql`
      mutation UpdateTeam($team_id: String!) {
        update_team(
          _set: { name: "new name" }
          where: { id: { _eq: $team_id } }
        ) {
          affected_rows
        }
      }
    `;

    const response = await client.mutate({
      mutation: query,

      variables: {
        team_id: teams.find((t) => t.id !== tokenTeamId)?.id,
      },
    });

    expect(response.data.update_team.affected_rows).toEqual(0);
    // Test using an team that the user is not a member of

    const { rows: testInvalidTeamMemberships } =
      (await integrationDBExecuteQuery(
        `SELECT id, user_id FROM "public"."membership" WHERE "team_id" = '${teams[1].id}' limit 1;`
      )) as { rows: Array<{ id: string; user_id: string }> };

    const testInvalidClient = await getAPIUserClient({
      team_id: teams[0].id,
      user_id: testInvalidTeamMemberships[0].user_id,
    });

    const testInvalidTeamResponse = await testInvalidClient.mutate({
      mutation: query,
      variables: {
        team_id: teams[0].id,
      },
    });
    expect(testInvalidTeamResponse.data.update_team.affected_rows).toEqual(0);
  });
});
