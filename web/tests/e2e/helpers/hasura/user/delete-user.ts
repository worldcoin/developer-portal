import { adminGraphqlClient } from "@e2e/helpers/hasura";
import { DeleteUserMutation, deleteUserSdk } from "./graphql";

export const deleteUser = async (id: string) => {
  let response: DeleteUserMutation;

  try {
    response = await deleteUserSdk(adminGraphqlClient).DeleteUser({ id });
  } catch (e) {
    throw new Error(
      `Failed to delete a user (${id}) from Hasura:\n${JSON.stringify(e, null, 2)}`,
    );
  }

  let result: any;

  try {
    result = response.delete_user_by_pk;
  } catch {}

  if (!result) {
    throw new Error(
      `Failed to delete a user (${id}):\n${JSON.stringify(response)}`,
    );
  }
};
