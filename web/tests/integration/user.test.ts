import { Role_Enum } from "@/graphql/graphql";
import { gql } from "@apollo/client";
import { integrationDBClean, integrationDBExecuteQuery } from "./setup";
import { getAPIUserClient } from "./test-utils";

// TODO: Consider moving this to a generalized jest environment
beforeEach(integrationDBClean);
describe("user role", () => {
  test("can't update another user", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id, name FROM "public"."team"`,
    )) as { rows: Array<{ id: string; name: string }> };

    const { rows: teamMemberships } = (await integrationDBExecuteQuery(
      `SELECT id, user_id, team_id, role FROM "public"."membership"`,
    )) as {
      rows: Array<{
        id: string;
        user_id: string;
        team_id: string;
        role: Role_Enum;
      }>;
    };

    const mutation = gql`
      mutation UpdateUser($id: String!, $name: String!) {
        update_user_by_pk(_set: { name: $name }, pk_columns: { id: $id }) {
          id
        }
      }
    `;

    const ownerUserFromTeam0 = teamMemberships.find(
      (membership) =>
        membership.team_id === teams[0].id &&
        membership.role === Role_Enum.Owner,
    );

    const userFromTeam1 = teamMemberships.find(
      (membership) => membership.team_id === teams[1].id,
    );

    const anotherUserFromTeam0 = teamMemberships.find(
      (membership) =>
        membership.team_id === teams[0].id &&
        membership.user_id !== ownerUserFromTeam0?.user_id,
    );

    const client = await getAPIUserClient({
      user_id: ownerUserFromTeam0?.user_id,
    });

    const response = await client.mutate<any>({
      mutation,
      variables: {
        id: userFromTeam1?.user_id,
        name: "new name",
      },
    });

    expect(response.data.update_user_by_pk).toEqual(null);

    const { rows: userFromTeam2AfterUpdate } = (await integrationDBExecuteQuery(
      `SELECT name FROM "public"."user" WHERE id = '${userFromTeam1?.user_id}'`,
    )) as { rows: Array<{ name: string }> };

    expect(userFromTeam2AfterUpdate[0].name).not.toBe("new name");

    const response2 = await client.mutate<any>({
      mutation,
      variables: {
        id: anotherUserFromTeam0?.user_id,
        name: "new name",
      },
    });
    expect(response2.data.update_user_by_pk).toEqual(null);

    const { rows: anotherUserFromTeam1AfterUpdate } =
      (await integrationDBExecuteQuery(
        `SELECT name FROM "public"."user" WHERE id = '${anotherUserFromTeam0?.user_id}'`,
      )) as { rows: Array<{ name: string }> };

    expect(anotherUserFromTeam1AfterUpdate[0].name).not.toBe("new name");
  });

  test("can't select user from a team you are not a part of", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id, name FROM "public"."team"`,
    )) as { rows: Array<{ id: string; name: string }> };

    const { rows: teamMemberships } = (await integrationDBExecuteQuery(
      `SELECT id, user_id, team_id, role FROM "public"."membership"`,
    )) as {
      rows: Array<{
        id: string;
        user_id: string;
        team_id: string;
        role: Role_Enum;
      }>;
    };

    const query = gql`
      query FetchUser($id: String!) {
        user(where: { id: { _eq: $id } }) {
          id
          email
          name
          memberships {
            id
            team {
              id
              name
            }
            role
          }
        }
      }
    `;

    const userFromTeam0 = teamMemberships.find(
      (membership) => membership.team_id === teams[0].id,
    );

    const userFromTeam1 = teamMemberships.find(
      (membership) => membership.team_id === teams[1].id,
    );

    const client = await getAPIUserClient({
      user_id: userFromTeam0?.user_id,
    });

    const response = await client.query<any>({
      query,
      variables: {
        id: userFromTeam1?.user_id,
      },
    });

    expect(response.data.user).toEqual([]);
  });

  // The `user` role's select filter is `self OR any teammate`, and Hasura cannot
  // vary columns per filter branch — so every column granted here is readable by
  // every teammate. `auth0Id` is the Auth0 Management API subject for the
  // account and no user-role query needs it (the portal reads its own from the
  // session, populated service-role), so it must stay off the role entirely.
  test("can't select auth0Id at all, not even for itself", async () => {
    const { rows: memberships } = (await integrationDBExecuteQuery(
      `SELECT user_id FROM "public"."membership" LIMIT 1`,
    )) as { rows: Array<{ user_id: string }> };

    const query = gql`
      query FetchOwnAuth0Id($id: String!) {
        user(where: { id: { _eq: $id } }) {
          id
          auth0Id
        }
      }
    `;

    const client = await getAPIUserClient({
      user_id: memberships[0].user_id,
    });

    await expect(
      client.query<any>({
        query,
        variables: { id: memberships[0].user_id },
      }),
    ).rejects.toThrow(/auth0Id/);
  });
});
