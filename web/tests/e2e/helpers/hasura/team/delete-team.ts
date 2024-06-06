import { adminGraphqlClient } from "@e2e/helpers/hasura";
import { DeleteTeamMutation, deleteTeamSdk } from "./graphql";

export const deleteTeam = async (id: string) => {
  let response: DeleteTeamMutation;

  try {
    response = await deleteTeamSdk(adminGraphqlClient).DeleteTeam({ id });
  } catch (e) {
    throw new Error(
      `Failed to delete a team (${id}) from Hasura:\n${JSON.stringify(e, null, 2)}`,
    );
  }

  let result: any;

  try {
    result = response.delete_team_by_pk;
  } catch {}

  if (!result) {
    throw new Error(`Failed to delete a team (${id}):\n${JSON.stringify(response)}`);
  }
};
