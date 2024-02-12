import {
  ApolloClient,
  createHttpLink,
  gql,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import getConfig from "next/config";
import { getAPIServiceClient } from "@/legacy/backend/graphql";
import { generateAPIKeyJWT, generateUserJWT } from "@/legacy/backend/jwts";
import { integrationDBExecuteQuery } from "./setup";
import { generateHashedSecret } from "@/legacy/backend/utils";

const { publicRuntimeConfig } = getConfig();

const httpLink = createHttpLink({
  uri: publicRuntimeConfig.NEXT_PUBLIC_GRAPHQL_API_URL,
});

export const testGetDefaultApp = async () => {
  const response = await integrationDBExecuteQuery(
    "SELECT * FROM app limit 1;",
  );
  return response.rows[0].id;
};

export const setClientSecret = async (app_id: string) => {
  const { secret: client_secret, hashed_secret } = generateHashedSecret(app_id);

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

export const getAPIUserClient = async (params?: {
  user_id?: string;
  team_id: string;
}): Promise<ApolloClient<NormalizedCacheObject>> => {
  const user_id = params?.user_id ?? "usr_a78f59e547fa5bd3d76bc1a1817c6d89";
  const team_id = params?.team_id ?? "team_d7cde14f17eda7e0ededba7ded6b4467"; // cspell: disable-line

  const authLink = setContext(async (_, { headers }) => ({
    headers: {
      ...headers,
      authorization: `Bearer ${
        (await generateUserJWT(user_id, team_id)).token
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

export const getAPIClient = async (params?: {
  team_id: string;
}): Promise<ApolloClient<NormalizedCacheObject>> => {
  const team_id = params?.team_id ?? "team_d7cde14f17eda7e0ededba7ded6b4467"; // cspell: disable-line

  const authLink = setContext(async (_, { headers }) => ({
    headers: {
      ...headers,
      authorization: `Bearer ${await generateAPIKeyJWT(team_id)}`,
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
