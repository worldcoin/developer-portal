import { CombinedGraphQLErrors } from "@apollo/client";

/**
 * Safely extract GraphQL extension code from Apollo errors.
 */
export const getGraphQLErrorCode = (error: unknown): string | null => {
  if (!CombinedGraphQLErrors.is(error)) {
    return null;
  }

  const code = error.errors?.[0]?.extensions?.code;
  return typeof code === "string" ? code : null;
};
