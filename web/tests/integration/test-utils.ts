import { gql } from "@apollo/client";
import { getAPIServiceClient } from "src/backend/graphql";
import { generateOIDCSecret } from "src/backend/oidc";
import { integrationDBExecuteQuery } from "./setup";

export const testGetDefaultApp = async () => {
  const response = await integrationDBExecuteQuery(
    "SELECT * FROM app limit 1;"
  );
  return response.rows[0].id;
};

export const setClientSecret = async (app_id: string) => {
  const { client_secret, hashed_secret } = generateOIDCSecret(app_id);

  const client = await getAPIServiceClient();

  const mutation = gql`
    mutation UpdateSecret($app_id: String!, $hashed_secret: String!) {
      update_action(
        where: { app_id: { _eq: $app_id }, action: { _eq: "" } }
        _set: { client_secret: $hashed_secret }
      ) {
        affected_rows
      }
    }
  `;

  const response = await client.mutate({
    mutation,
    variables: {
      app_id,
      hashed_secret,
    },
  });

  if (response.data?.update_action?.affected_rows !== 1) {
    throw new Error("Unable to update client secret.");
  }

  return { client_secret };
};
