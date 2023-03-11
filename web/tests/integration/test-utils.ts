import {
  ApolloClient,
  createHttpLink,
  gql,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import getConfig from "next/config";
import { getAPIServiceClient } from "src/backend/graphql";
import { generateUserJWT } from "src/backend/jwts";
import { generateOIDCSecret } from "src/backend/oidc";
import { integrationDBExecuteQuery } from "./setup";

const { publicRuntimeConfig } = getConfig();

const httpLink = createHttpLink({
  uri: publicRuntimeConfig.NEXT_PUBLIC_GRAPHQL_API_URL,
});

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

export const getAPIUserClient = async (): Promise<
  ApolloClient<NormalizedCacheObject>
> => {
  const authLink = setContext(async (_, { headers }) => ({
    headers: {
      ...headers,
      authorization: `Bearer ${
        (
          await generateUserJWT(
            "usr_a78f59e547fa5bd3d76bc1a1817c6d89",
            "team_d7cde14f17eda7e0ededba7ded6b4467" // cspell: disable-line
          )
        ).token
      }`,
    },
  }));

  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
    defaultOptions: {
      query: {
        fetchPolicy: "no-cache",
      },
    },
  });
};
