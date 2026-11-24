import { gql } from "@apollo/client";

import { integrationDBClean, integrationDBExecuteQuery } from "./setup";

import { getAPIUserClient } from "./test-utils";
// TODO: Consider moving this to a generalized jest environment
beforeEach(integrationDBClean);

describe("user role", () => {
  test("owner users can't delete their own membership when there is only one owner in the team", async () => {
    const { rows: ownerMemberships } = (await integrationDBExecuteQuery(
      `SELECT id, user_id FROM "public"."membership" WHERE role = 'OWNER'`,
    )) as { rows: Array<{ id: string; user_id: string }> };

    const ownerMembership = ownerMemberships[0];

    const client = await getAPIUserClient({
      user_id: ownerMembership.user_id,
    });

    const mutation = gql`
      mutation DeleteMembership($id: String!) {
        delete_membership_by_pk(id: $id) {
          id
        }
      }
    `;

    const response = await client.mutate<any>({
      mutation,
      variables: {
        id: ownerMembership.id,
      },
    });

    expect(response.data.delete_membership_by_pk).toBeNull();
  });

  test("owner users can delete their own membership when there is more than one owner in the team", async () => {
    const { rows: ownerMemberships } = (await integrationDBExecuteQuery(
      `SELECT id, user_id, team_id FROM "public"."membership" WHERE role = 'OWNER'`,
    )) as { rows: Array<{ id: string; user_id: string; team_id: string }> };

    const { rows: promotedOwnerMemberships } = (await integrationDBExecuteQuery(
      `UPDATE "public"."membership"
       SET role = 'OWNER'
       WHERE id = (
         SELECT id FROM "public"."membership"
         WHERE team_id = $1 AND role = 'MEMBER'
         LIMIT 1
       )
       RETURNING id, user_id`,
      [ownerMemberships[0].team_id],
    )) as { rows: Array<{ id: string; user_id: string }> };

    const secondOwner = promotedOwnerMemberships[0];

    const client = await getAPIUserClient({
      user_id: secondOwner.user_id,
    });

    const mutation = gql`
      mutation DeleteMembership($id: String!) {
        delete_membership_by_pk(id: $id) {
          id
        }
      }
    `;

    const response = await client.mutate<any>({
      mutation,
      variables: {
        id: secondOwner.id,
      },
    });

    expect(response.data.delete_membership_by_pk.id).toBe(secondOwner.id);
  });

  test("member can leave the team", async () => {
    const { rows: memberMemberships } = (await integrationDBExecuteQuery(
      `SELECT id, user_id FROM "public"."membership" WHERE role = 'MEMBER'`,
    )) as { rows: Array<{ id: string; user_id: string }> };

    const memberMembership = memberMemberships[0];

    const client = await getAPIUserClient({
      user_id: memberMembership.user_id,
    });

    const mutation = gql`
      mutation DeleteMembership($id: String!) {
        delete_membership_by_pk(id: $id) {
          id
        }
      }
    `;

    const response = await client.mutate<any>({
      mutation,
      variables: {
        id: memberMembership.id,
      },
    });

    expect(response.data.delete_membership_by_pk.id).toBe(memberMembership.id);
  });

  test("owner can remove a member from the team", async () => {
    const { rows: ownerMemberships } = (await integrationDBExecuteQuery(
      `SELECT id, user_id, team_id FROM "public"."membership" WHERE role = 'OWNER'`,
    )) as { rows: Array<{ id: string; user_id: string; team_id: string }> };

    const ownerMembership = ownerMemberships[0];

    const { rows: memberMemberships } = (await integrationDBExecuteQuery(
      `SELECT id, user_id FROM "public"."membership" WHERE role = 'MEMBER' AND team_id = '${ownerMembership.team_id}'`,
    )) as { rows: Array<{ id: string; user_id: string }> };

    const memberMembership = memberMemberships[0];

    const client = await getAPIUserClient({
      user_id: ownerMembership.user_id,
    });

    const mutation = gql`
      mutation DeleteMembership($id: String!) {
        delete_membership_by_pk(id: $id) {
          id
        }
      }
    `;

    const response = await client.mutate<any>({
      mutation,
      variables: {
        id: memberMembership.id,
      },
    });

    expect(response.data.delete_membership_by_pk.id).toBe(memberMembership.id);
  });
});
