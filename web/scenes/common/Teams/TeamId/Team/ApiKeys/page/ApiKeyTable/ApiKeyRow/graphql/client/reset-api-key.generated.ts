/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type ResetApiKeyMutationVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
  team_id: Types.Scalars["String"]["input"];
}>;

export type ResetApiKeyMutation = {
  __typename?: "mutation_root";
  reset_api_key?: { __typename?: "ResetAPIOutput"; api_key: string } | null;
};

export const ResetApiKeyDocument = gql`
  mutation ResetAPIKey($id: String!, $team_id: String!) {
    reset_api_key(id: $id, team_id: $team_id) {
      api_key
    }
  }
`;
export type ResetApiKeyMutationFn = Apollo.MutationFunction<
  ResetApiKeyMutation,
  ResetApiKeyMutationVariables
>;

/**
 * __useResetApiKeyMutation__
 *
 * To run a mutation, you first call `useResetApiKeyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useResetApiKeyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [resetApiKeyMutation, { data, loading, error }] = useResetApiKeyMutation({
 *   variables: {
 *      id: // value for 'id'
 *      team_id: // value for 'team_id'
 *   },
 * });
 */
export function useResetApiKeyMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ResetApiKeyMutation,
    ResetApiKeyMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<ResetApiKeyMutation, ResetApiKeyMutationVariables>(
    ResetApiKeyDocument,
    options,
  );
}
export type ResetApiKeyMutationHookResult = ReturnType<
  typeof useResetApiKeyMutation
>;
export type ResetApiKeyMutationResult =
  Apollo.MutationResult<ResetApiKeyMutation>;
export type ResetApiKeyMutationOptions = Apollo.BaseMutationOptions<
  ResetApiKeyMutation,
  ResetApiKeyMutationVariables
>;
