/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type SwitchToSelfManagedMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  new_manager_address: Types.Scalars["String"]["input"];
}>;

export type SwitchToSelfManagedMutation = {
  __typename?: "mutation_root";
  switch_to_self_managed?: {
    __typename?: "SwitchToSelfManagedOutput";
    rp_id: string;
    status: string;
    operation_hash?: string | null;
  } | null;
};

export const SwitchToSelfManagedDocument = gql`
  mutation SwitchToSelfManaged(
    $app_id: String!
    $new_manager_address: String!
  ) {
    switch_to_self_managed(
      app_id: $app_id
      new_manager_address: $new_manager_address
    ) {
      rp_id
      status
      operation_hash
    }
  }
`;
export type SwitchToSelfManagedMutationFn = Apollo.MutationFunction<
  SwitchToSelfManagedMutation,
  SwitchToSelfManagedMutationVariables
>;

/**
 * __useSwitchToSelfManagedMutation__
 *
 * To run a mutation, you first call `useSwitchToSelfManagedMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSwitchToSelfManagedMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [switchToSelfManagedMutation, { data, loading, error }] = useSwitchToSelfManagedMutation({
 *   variables: {
 *      app_id: // value for 'app_id'
 *      new_manager_address: // value for 'new_manager_address'
 *   },
 * });
 */
export function useSwitchToSelfManagedMutation(
  baseOptions?: Apollo.MutationHookOptions<
    SwitchToSelfManagedMutation,
    SwitchToSelfManagedMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    SwitchToSelfManagedMutation,
    SwitchToSelfManagedMutationVariables
  >(SwitchToSelfManagedDocument, options);
}
export type SwitchToSelfManagedMutationHookResult = ReturnType<
  typeof useSwitchToSelfManagedMutation
>;
export type SwitchToSelfManagedMutationResult =
  Apollo.MutationResult<SwitchToSelfManagedMutation>;
export type SwitchToSelfManagedMutationOptions = Apollo.BaseMutationOptions<
  SwitchToSelfManagedMutation,
  SwitchToSelfManagedMutationVariables
>;
