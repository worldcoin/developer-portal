import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { generateServiceJWT } from "src/backend/jwts";
import getConfig from "next/config";
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
 * Returns an Apollo Client to interact with the consumer backend (Worldcoin API)
 * @returns
 */
export const getWLDAppBackendServiceClient = async (
  is_staging: boolean
): Promise<ApolloClient<NormalizedCacheObject>> => {
  const consumerBackendLink = createHttpLink({
    uri: is_staging
      ? "https://api.staging.consumer.worldcoin.org/v1/graphql"
      : "https://api.consumer.worldcoin.org/v1/graphql",
  });

  const authLink = setContext(async (_, { headers }) => ({
    headers: {
      ...headers,
      authorization: `Bearer ${
        is_staging
          ? process.env.CONSUMER_BACKEND_JWT_STAGING
          : process.env.CONSUMER_BACKEND_JWT
      }`,
    },
  }));

  return new ApolloClient({
    link: authLink.concat(consumerBackendLink),
    cache: new InMemoryCache(),
    defaultOptions: {
      query: {
        fetchPolicy: "no-cache",
      },
    },
  });
};
