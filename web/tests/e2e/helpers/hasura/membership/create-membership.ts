import { adminGraphqlClient } from "@e2e/helpers/hasura";
import { InsertMembershipMutation, insertMembershipSdk } from "./graphql";
import { Role_Enum } from "@/graphql/graphql";

export const createMembership = async (params: {
  teamId: string;
  userId: string;
  role: Role_Enum;
  membershipId?: string;
}) => {
  let response: InsertMembershipMutation;

  try {
    response = await insertMembershipSdk(adminGraphqlClient).InsertMembership({
      object: {
        team_id: params.teamId,
        user_id: params.userId,
        role: params.role,
        ...(params.membershipId ? { id: params.membershipId } : {}),
      },
    });
  } catch (e) {
    throw new Error(
      `Failed to create a membership in Hasura:\n${JSON.stringify(e, null, 2)}`,
    );
  }

  let id: string | undefined;

  try {
    id = response.insert_membership_one?.id;
  } catch {}

  if (!id) {
    throw new Error(
      `Failed to parse membership id from the response body:\n${JSON.stringify(response)}`,
    );
  }

  return id;
};
