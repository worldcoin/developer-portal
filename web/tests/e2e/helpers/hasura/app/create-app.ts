import { adminGraphqlClient } from "@e2e/helpers/hasura";
import { InsertAppMutation, insertAppSdk } from "./graphql";
import { constants } from "@e2e/helpers";

export const createApp = async (name: string) => {
  let response: InsertAppMutation;

  try {
    response = await insertAppSdk(adminGraphqlClient).InsertApp({
      object: {
        name,
        team_id: constants.teamId,
        app_metadata: { data: [{ name }] },
      },
    });
  } catch (e) {
    throw new Error(
      `Failed to create an app in Hasura:\n${JSON.stringify(e, null, 2)}`,
    );
  }

  let id: string | undefined;

  try {
    id = response.insert_app_one?.id;
  } catch {}

  if (!id) {
    throw new Error(
      `Failed to parse app id from the response body:\n${JSON.stringify(response)}`,
    );
  }

  return id;
};
