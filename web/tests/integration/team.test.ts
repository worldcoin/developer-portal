import { POST } from "@/api/hasura/invite-team-members";
import { Role_Enum } from "@/graphql/graphql";
import { gql } from "@apollo/client";
import { NextRequest } from "next/server";
import { integrationDBClean, integrationDBExecuteQuery } from "./setup";
import {
  getAPIClient,
  getAPIServiceClient,
  getAPIUserClient,
} from "./test-utils";

// TODO: Consider moving this to a generalized jest environment
beforeEach(integrationDBClean);
describe("team model", () => {
  test("verified logo is properly sent when team is verified", async () => {
    // TODO
    const client = await getAPIServiceClient();
  });
});

describe("user role", () => {
  test("only authorized roles can update team", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id, name FROM "public"."team" limit 1`,
    )) as { rows: Array<{ id: string; name: string }> };

    const nameBeforeUpdate = teams[0].name;
    const team_id = teams[0].id;

    const { rows: teamMemberships } = (await integrationDBExecuteQuery(
      `SELECT id, user_id, team_id, role FROM "public"."membership" WHERE "team_id" = '${teams[0].id}'`,
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
          `UPDATE "public"."team" SET "name" = '${nameBeforeUpdate}' WHERE "id" = '${team_id}' RETURNING "name";`,
        );
      } else {
        expect(response.data?.update_team?.affected_rows).toEqual(0);
        // Additional SQL query to confirm the team name has not changed
        const { rows: unchangedTeam } = (await integrationDBExecuteQuery(
          `SELECT name FROM "public"."team" WHERE "id" = '${team_id}'`,
        )) as { rows: Array<{ name: string }> };
        expect(unchangedTeam[0].name).toEqual(nameBeforeUpdate);
      }
    }
  });

  test("cannot select another team", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."team"`,
    )) as { rows: Array<{ id: string }> };

    for (const team of teams) {
      const { rows: teamMemberships } = (await integrationDBExecuteQuery(
        `SELECT id, user_id FROM "public"."membership" WHERE "team_id" = '${team.id}' limit 1;`,
      )) as { rows: Array<{ id: string; user_id: string }> };

      const client = await getAPIUserClient({
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
  });

  test("cannot select another team with an invalid team_id", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."team"`,
    )) as { rows: Array<{ id: string }> };

    // Test using an team that the user is not a member of
    const { rows: testInvalidTeamMemberships } =
      (await integrationDBExecuteQuery(
        `SELECT id, user_id FROM "public"."membership" WHERE "team_id" = '${teams[1].id}' limit 1;`,
      )) as { rows: Array<{ id: string; user_id: string }> };

    const testInvalidClient = await getAPIUserClient({
      user_id: testInvalidTeamMemberships[0].user_id,
    });

    const query = gql`
      query ListTeams {
        team (where: {id: {_eq: "${teams[0].id}"}}) {
          id
        }
      }`;

    const response = await testInvalidClient.query({ query });
    expect(response.data.team.length).toEqual(0);
  });

  test("cannot update another team", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."team";`,
    )) as { rows: Array<{ id: string }> };

    const { rows: teamMemberships } = (await integrationDBExecuteQuery(
      `SELECT id, user_id, team_id FROM "public"."membership" WHERE "team_id" = '${teams[0].id}' limit 1;`,
    )) as { rows: Array<{ id: string; user_id: string; team_id: string }> };

    const tokenUserId = teamMemberships[0].user_id;
    const tokenTeamId = teamMemberships[0].team_id;

    const client = await getAPIUserClient({
      user_id: tokenUserId,
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
  });

  test("cannot invite team members as member", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."team";`,
    )) as { rows: Array<{ id: string }> };

    const { rows: memberRoleMemberships } = (await integrationDBExecuteQuery(
      `SELECT id, user_id, team_id FROM "public"."membership" WHERE "team_id" = '${teams[0].id}' AND "role" = 'MEMBER' limit 1;`,
    )) as { rows: Array<{ id: string; user_id: string; team_id: string }> };

    const memberRoleUserId = memberRoleMemberships[0].user_id;
    const memberRoleTeamId = memberRoleMemberships[0].team_id;

    const req = new NextRequest(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/hasura/reset-client-secret`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.INTERNAL_ENDPOINTS_SECRET!,
        },
        body: JSON.stringify({
          input: { emails: ["test@gmail.com"], team_id: memberRoleTeamId },
          action: { name: "invite_team_members" },
          session_variables: {
            "x-hasura-role": "user",
            "x-hasura-user-id": memberRoleUserId,
          },
        }),
      },
    );

    const res = await POST(req);
    const responseJSON = await res?.json();
    expect(responseJSON.extensions.code).toBe("insufficient_permissions");
  });

  test("cannot invite team members to another team", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."team";`,
    )) as { rows: Array<{ id: string }> };

    const { rows: teamMemberships } = (await integrationDBExecuteQuery(
      `SELECT id, user_id, team_id FROM "public"."membership" WHERE "team_id" = '${teams[0].id}' AND "role" = 'MEMBER' limit 1;`,
    )) as { rows: Array<{ id: string; user_id: string; team_id: string }> };

    const tokenUserId = teamMemberships[0].user_id;
    const tokenTeamId = teams[1].id;

    const req = new NextRequest(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/hasura/reset-client-secret`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.INTERNAL_ENDPOINTS_SECRET!,
        },
        body: JSON.stringify({
          input: { emails: ["test@gmail.com"], team_id: tokenTeamId },
          action: { name: "invite_team_members" },
          session_variables: {
            "x-hasura-role": "user",
            "x-hasura-user-id": tokenUserId,
          },
        }),
      },
    );

    const res = await POST(req);
    const responseJSON = await res?.json();
    expect(responseJSON.extensions.code).toBe("insufficient_permissions");
  });

  test("can invite team members", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."team";`,
    )) as { rows: Array<{ id: string }> };

    const { rows: teamMemberships } = (await integrationDBExecuteQuery(
      `SELECT id, user_id, team_id FROM "public"."membership" WHERE "team_id" = '${teams[0].id}' AND "role" = 'OWNER' limit 1;`,
    )) as { rows: Array<{ id: string; user_id: string; team_id: string }> };

    const tokenUserId = teamMemberships[0].user_id;
    const tokenTeamId = teamMemberships[0].team_id;

    const req = new NextRequest(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/hasura/reset-client-secret`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.INTERNAL_ENDPOINTS_SECRET!,
        },
        body: JSON.stringify({
          input: { emails: ["test@gmail.com"], team_id: tokenTeamId },
          action: { name: "invite_team_members" },
          session_variables: {
            "x-hasura-role": "user",
            "x-hasura-user-id": tokenUserId,
          },
        }),
      },
    );

    const res = await POST(req);
    const responseJSON = await res?.json();
    expect(responseJSON.emails).toEqual(["test@gmail.com"]);
  });
});

describe("api_key role", () => {
  test("API Key: cannot select another team", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id FROM "public"."team"`,
    )) as { rows: Array<{ id: string }> };

    for (const team of teams) {
      const client = await getAPIClient({
        team_id: team.id,
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
  });
});

// TODO: Add test cases using the /v1/graphql route
