import { GraphQLClient } from "graphql-request";

export const adminGraphqlClient = new GraphQLClient(
  process.env.NEXT_PUBLIC_GRAPHQL_API_URL!,
  {
    headers: {
      "x-hasura-admin-secret": process.env.HASURA_GRAPHQL_ADMIN_SECRET!,
    },
  },
);
