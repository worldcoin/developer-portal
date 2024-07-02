import { adminGraphqlClient } from "@e2e/helpers/hasura";
import { DeleteAppsMutation, deleteAppsSdk } from "./graphql";

export const deleteAppsForTeam = async (teamId: string): Promise<void> => {
  let response: DeleteAppsMutation;

  try {
    response = await deleteAppsSdk(adminGraphqlClient).DeleteApps({
      where: { team_id: { _eq: teamId } },
    });
  } catch (e) {
    throw new Error(
      `Failed to delete apps for team (${teamId}) from Hasura:\n${JSON.stringify(e, null, 2)}`,
    );
  }

  let affected_rows;

  try {
    affected_rows = response.delete_app?.affected_rows;
  } catch {}

  if (!affected_rows) {
    throw new Error(
      `Failed to delete apps for team (${teamId}) from Hasura:\n${JSON.stringify(response, null, 2)}`,
    );
  }
};
