/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type RetryRpMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  environment: Types.Scalars["String"]["input"];
}>;

export type RetryRpMutation = {
  __typename?: "mutation_root";
  retry_rp?: {
    __typename?: "RetryRpOutput";
    success: boolean;
    environment: string;
    operation_hash?: string | null;
  } | null;
};

export const RetryRpDocument = gql`
  mutation RetryRp($rp_id: String!, $environment: String!) {
    retry_rp(rp_id: $rp_id, environment: $environment) {
      success
      environment
      operation_hash
    }
  }
`;
export type RetryRpMutationFn = Apollo.MutationFunction<
  RetryRpMutation,
  RetryRpMutationVariables
>;

/**
 * __useRetryRpMutation__
 *
 * To run a mutation, you first call `useRetryRpMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRetryRpMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [retryRpMutation, { data, loading, error }] = useRetryRpMutation({
 *   variables: {
 *      rp_id: // value for 'rp_id'
 *      environment: // value for 'environment'
 *   },
 * });
 */
export function useRetryRpMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RetryRpMutation,
    RetryRpMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<RetryRpMutation, RetryRpMutationVariables>(
    RetryRpDocument,
    options,
  );
}
export type RetryRpMutationHookResult = ReturnType<typeof useRetryRpMutation>;
export type RetryRpMutationResult = Apollo.MutationResult<RetryRpMutation>;
export type RetryRpMutationOptions = Apollo.BaseMutationOptions<
  RetryRpMutation,
  RetryRpMutationVariables
>;
