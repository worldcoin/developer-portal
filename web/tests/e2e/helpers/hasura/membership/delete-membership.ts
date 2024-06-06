import { adminGraphqlClient } from "@e2e/helpers/hasura";
import { DeleteMembershipMutation, deleteMembershipSdk } from "./graphql";

export const deleteMembership = async (id: string) => {
  let response: DeleteMembershipMutation;

  try {
    response = await deleteMembershipSdk(adminGraphqlClient).DeleteMembership({
      id,
    });
  } catch (e) {
    throw new Error(
      `Failed to create a membership (${id}) in Hasura:\n${JSON.stringify(e, null, 2)}`,
    );
  }

  let result: any;

  try {
    result = response.delete_membership_by_pk;
  } catch {}

  if (!result) {
    throw new Error(
      `Failed to delete a membership (${id}):\n${JSON.stringify(response)}`,
    );
  }

  return id;
};
