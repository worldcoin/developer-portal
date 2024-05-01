import "server-only";

import { generateAPIKeyJWT, generateServiceJWT } from "@/api/helpers/jwts";
import { GraphQLClient } from "graphql-request";

/**
 * Used for generated requests
 * Returns an GraphQLClient to interact with GraphQL's API with a service token
 * @returns
 */
export const getAPIServiceGraphqlClient = async () => {
  return new GraphQLClient(process.env.NEXT_PUBLIC_GRAPHQL_API_URL!, {
    headers: {
      authorization: `Bearer ${await generateServiceJWT()}`,
    },
  });
};

export const getAPIKeyGraphqlClient = async (params: { team_id: string }) => {
  return new GraphQLClient(process.env.NEXT_PUBLIC_GRAPHQL_API_URL!, {
    headers: {
      authorization: `Bearer ${await generateAPIKeyJWT(params.team_id)}`,
    },
  });
};
