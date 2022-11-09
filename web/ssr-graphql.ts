import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  NormalizedCacheObject,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { NextApiRequest } from "next";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();

const httpLink = createHttpLink({
  uri: publicRuntimeConfig.NEXT_PUBLIC_GRAPHQL_API_URL,
});

/**
 * Returns an Apollo Client to interact with GraphQL's API with a service token
 * @returns
 */
export const getAPISSRClient = async (
  req: NextApiRequest
): Promise<ApolloClient<NormalizedCacheObject>> => {
  console.log(req.headers);

  const authLink = setContext(async (_, { headers }) => ({
    headers: {
      ...headers,
      authorization: req.headers.authorization,
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
