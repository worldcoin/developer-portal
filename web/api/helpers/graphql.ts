import "server-only";

import {
  generateAPIKeyJWT,
  generateReviewerJWT,
  generateServiceJWT,
} from "@/api/helpers/jwts";
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

/**
 * Used for generated requests
 * Returns an GraphQLClient to interact with GraphQL's API with a API Key token
 * @returns
 */
export const getAPIKeyGraphqlClient = async (params: { team_id: string }) => {
  return new GraphQLClient(process.env.NEXT_PUBLIC_GRAPHQL_API_URL!, {
    headers: {
      authorization: `Bearer ${await generateAPIKeyJWT(params.team_id)}`,
    },
  });
};

/**
 * Used for generated requests
 * Returns an GraphQLClient to interact with GraphQL's API with a reviewer token
 * See Documentation: https://www.notion.so/worldcoin/Reviewer-Role-Specification-5c43c442735842d7ae57e19823a962fb?pvs=4
 * @returns
 */
export const getAPIReviewerGraphqlClient = async () => {
  return new GraphQLClient(process.env.NEXT_PUBLIC_GRAPHQL_API_URL!, {
    headers: {
      authorization: `Bearer ${await generateReviewerJWT()}`,
    },
  });
};
