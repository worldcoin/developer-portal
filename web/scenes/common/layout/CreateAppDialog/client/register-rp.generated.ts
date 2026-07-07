/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type RegisterRpMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  mode?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  signer_address?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type RegisterRpMutation = {
  __typename?: "mutation_root";
  register_rp?: {
    __typename?: "RegisterRpOutput";
    rp_id: string;
    manager_address?: string | null;
    signer_address?: string | null;
    status: string;
    operation_hash?: string | null;
  } | null;
};

export const RegisterRpDocument = gql`
  mutation RegisterRp(
    $app_id: String!
    $mode: String
    $signer_address: String
  ) {
    register_rp(app_id: $app_id, mode: $mode, signer_address: $signer_address) {
      rp_id
      manager_address
      signer_address
      status
      operation_hash
    }
  }
`;
export type RegisterRpMutationFn = Apollo.MutationFunction<
  RegisterRpMutation,
  RegisterRpMutationVariables
>;

/**
 * __useRegisterRpMutation__
 *
 * To run a mutation, you first call `useRegisterRpMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterRpMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerRpMutation, { data, loading, error }] = useRegisterRpMutation({
 *   variables: {
 *      app_id: // value for 'app_id'
 *      mode: // value for 'mode'
 *      signer_address: // value for 'signer_address'
 *   },
 * });
 */
export function useRegisterRpMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RegisterRpMutation,
    RegisterRpMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<RegisterRpMutation, RegisterRpMutationVariables>(
    RegisterRpDocument,
    options,
  );
}
export type RegisterRpMutationHookResult = ReturnType<
  typeof useRegisterRpMutation
>;
export type RegisterRpMutationResult =
  Apollo.MutationResult<RegisterRpMutation>;
export type RegisterRpMutationOptions = Apollo.BaseMutationOptions<
  RegisterRpMutation,
  RegisterRpMutationVariables
>;
