import { adminGraphqlClient } from "@e2e/helpers/hasura";
import { InsertUserMutation, insertUserSdk } from "./graphql";

export const createUser = async (params: {
  auth0Id: string;
  email: string;
  teamId: string;
}) => {
  let response: InsertUserMutation;

  try {
    response = await insertUserSdk(adminGraphqlClient).InsertUser({
      object: {
        auth0Id: params.auth0Id,
        email: params.email,
        is_subscribed: false,
        ironclad_id: crypto.randomUUID(),
        team_id: params.teamId,
      },
    });
  } catch (e) {
    throw new Error(
      `Failed to create a user in Hasura:\n${JSON.stringify(e, null, 2)}`,
    );
  }

  let id: string | undefined;

  try {
    id = response.insert_user_one?.id;
  } catch {}

  if (!id) {
    throw new Error(
      `Failed to parse user id from the response body:\n${JSON.stringify(response)}`,
    );
  }

  return id;
};
