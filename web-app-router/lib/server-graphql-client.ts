import { GraphQLClient } from "graphql-request";

/**
 * Used for generated requests
 * Returns an GraphQLClient to interact with GraphQL's API with a service token
 * @returns
 */
export const getAPIServiceGraphqlClient = async () => {
  return new GraphQLClient(process.env.NEXT_PUBLIC_GRAPHQL_API_URL!, {
    headers: {
      authorization: `Bearer SOME KEY`,
    },
  });
};
