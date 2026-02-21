import { ApolloError } from "@apollo/client";

/**
 * Safely extract GraphQL extension code from Apollo errors.
 */
export const getGraphQLErrorCode = (error: unknown): string | null => {
  if (!(error instanceof ApolloError)) {
    return null;
  }

  const code = error.graphQLErrors?.[0]?.extensions?.code;
  return typeof code === "string" ? code : null;
};
