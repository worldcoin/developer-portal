/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type RotateSignerKeyMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  new_signer_address: Types.Scalars["String"]["input"];
}>;

export type RotateSignerKeyMutation = {
  __typename?: "mutation_root";
  rotate_signer_key?: {
    __typename?: "RotateSignerKeyOutput";
    rp_id: string;
    new_signer_address: string;
    old_signer_address: string;
    status: string;
    operation_hash?: string | null;
  } | null;
};

export const RotateSignerKeyDocument = gql`
  mutation RotateSignerKey($app_id: String!, $new_signer_address: String!) {
    rotate_signer_key(
      app_id: $app_id
      new_signer_address: $new_signer_address
    ) {
      rp_id
      new_signer_address
      old_signer_address
      status
      operation_hash
    }
  }
`;
export type RotateSignerKeyMutationFn = Apollo.MutationFunction<
  RotateSignerKeyMutation,
  RotateSignerKeyMutationVariables
>;

/**
 * __useRotateSignerKeyMutation__
 *
 * To run a mutation, you first call `useRotateSignerKeyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRotateSignerKeyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [rotateSignerKeyMutation, { data, loading, error }] = useRotateSignerKeyMutation({
 *   variables: {
 *      app_id: // value for 'app_id'
 *      new_signer_address: // value for 'new_signer_address'
 *   },
 * });
 */
export function useRotateSignerKeyMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RotateSignerKeyMutation,
    RotateSignerKeyMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RotateSignerKeyMutation,
    RotateSignerKeyMutationVariables
  >(RotateSignerKeyDocument, options);
}
export type RotateSignerKeyMutationHookResult = ReturnType<
  typeof useRotateSignerKeyMutation
>;
export type RotateSignerKeyMutationResult =
  Apollo.MutationResult<RotateSignerKeyMutation>;
export type RotateSignerKeyMutationOptions = Apollo.BaseMutationOptions<
  RotateSignerKeyMutation,
  RotateSignerKeyMutationVariables
>;
