import { getAPIServiceClient } from "src/backend/graphql";
import {
  integrationDBSetup,
  integrationDBTearDown,
  integrationDBExecuteQuery,
} from "./setup";
import { getAPIUserClient } from "./test-utils";
import { gql } from "@apollo/client";
import { Role_Enum } from "@/graphql/graphql";
import { inspect } from "util";

// TODO: Consider moving this to a generalized jest environment
beforeEach(integrationDBSetup);
beforeEach(integrationDBTearDown);

describe("user role", () => {
  test("can't update user from another team", async () => {
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT id, name FROM "public"."team"`
    )) as { rows: Array<{ id: string; name: string }> };

    const { rows: teamMemberships } = (await integrationDBExecuteQuery(
      `SELECT id, user_id, team_id, role FROM "public"."membership"`
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

    const ownerUserFromTeam1 = teamMemberships.find(
      (membership) =>
        membership.team_id === teams[0].id &&
        membership.role === Role_Enum.Owner
    );

    const userFromTeam2 = teamMemberships.find(
      (membership) => membership.team_id === teams[1].id
    );

    const client = await getAPIUserClient({
      team_id: teams[0].id,
      user_id: ownerUserFromTeam1?.user_id,
    });

    const response = await client.mutate({
      mutation,
      variables: {
        id: userFromTeam2?.user_id,
        name: "new name",
      },
    });

    expect(response.data.update_user_by_pk).toEqual(null);
  });
});
