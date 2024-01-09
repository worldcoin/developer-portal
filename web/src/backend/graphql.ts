import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import getConfig from "next/config";
import { generateServiceJWT } from "src/backend/jwts";
import { GraphQLClient } from "graphql-request";

const { publicRuntimeConfig } = getConfig();

const httpLink = createHttpLink({
  uri: publicRuntimeConfig.NEXT_PUBLIC_GRAPHQL_API_URL,
});

/**
 * Returns an Apollo Client to interact with GraphQL's API with a service token
 * @returns
 */
export const getAPIServiceClient = async (): Promise<
  ApolloClient<NormalizedCacheObject>
> => {
  const authLink = setContext(async (_, { headers }) => ({
    headers: {
      ...headers,
      authorization: `Bearer ${await generateServiceJWT()}`,
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

/**
 * Used for generated requests
 * Returns an GraphQLClient to interact with GraphQL's API with a service token
 * @returns
 */
export const getAPIServiceGraphqlClient = async () => {
  return new GraphQLClient(publicRuntimeConfig.NEXT_PUBLIC_GRAPHQL_API_URL, {
    headers: {
      authorization: `Bearer ${await generateServiceJWT()}`,
    },
  });
};
