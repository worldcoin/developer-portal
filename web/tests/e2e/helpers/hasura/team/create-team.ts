import { adminGraphqlClient } from "@e2e/helpers/hasura";
import { InsertTeamMutation, insertTeamSdk } from "./graphql";

export const createTeam = async (name: string) => {
  let response: InsertTeamMutation;

  try {
    response = await insertTeamSdk(adminGraphqlClient).InsertTeam({
      object: { name },
    });
  } catch (e) {
    throw new Error(
      `Failed to create a team in Hasura:\n${JSON.stringify(e, null, 2)}`,
    );
  }

  let id: string | undefined;

  try {
    id = response.insert_team_one?.id;
  } catch {}

  if (!id) {
    throw new Error(
      `Failed to parse team id from the response body:\n${JSON.stringify(response)}`,
    );
  }

  return id;
};
