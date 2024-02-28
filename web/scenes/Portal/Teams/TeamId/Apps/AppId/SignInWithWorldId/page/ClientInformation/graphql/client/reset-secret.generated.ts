/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type ResetClientSecretMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"];
  team_id: Types.Scalars["String"];
}>;

export type ResetClientSecretMutation = {
  __typename?: "mutation_root";
  reset_client_secret?: {
    __typename?: "ResetClientOutput";
    client_secret: string;
  } | null;
};

export const ResetClientSecretDocument = gql`
  mutation ResetClientSecret($app_id: String!, $team_id: String!) {
    reset_client_secret(app_id: $app_id, team_id: $team_id) {
      client_secret
    }
  }
`;
export type ResetClientSecretMutationFn = Apollo.MutationFunction<
  ResetClientSecretMutation,
  ResetClientSecretMutationVariables
>;

/**
 * __useResetClientSecretMutation__
 *
 * To run a mutation, you first call `useResetClientSecretMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useResetClientSecretMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [resetClientSecretMutation, { data, loading, error }] = useResetClientSecretMutation({
 *   variables: {
 *      app_id: // value for 'app_id'
 *      team_id: // value for 'team_id'
 *   },
 * });
 */
export function useResetClientSecretMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ResetClientSecretMutation,
    ResetClientSecretMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    ResetClientSecretMutation,
    ResetClientSecretMutationVariables
  >(ResetClientSecretDocument, options);
}
export type ResetClientSecretMutationHookResult = ReturnType<
  typeof useResetClientSecretMutation
>;
export type ResetClientSecretMutationResult =
  Apollo.MutationResult<ResetClientSecretMutation>;
export type ResetClientSecretMutationOptions = Apollo.BaseMutationOptions<
  ResetClientSecretMutation,
  ResetClientSecretMutationVariables
>;
