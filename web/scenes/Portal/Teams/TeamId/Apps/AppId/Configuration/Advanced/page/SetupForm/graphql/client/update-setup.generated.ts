/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpdateSetupMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"];
  app_mode: Types.Scalars["String"];
  whitelisted_addresses?: Types.InputMaybe<
    Array<Types.Scalars["String"]> | Types.Scalars["String"]
  >;
  associated_domains?: Types.InputMaybe<
    Array<Types.Scalars["String"]> | Types.Scalars["String"]
  >;
  contracts?: Types.InputMaybe<
    Array<Types.Scalars["String"]> | Types.Scalars["String"]
  >;
  permit2_tokens?: Types.InputMaybe<
    Array<Types.Scalars["String"]> | Types.Scalars["String"]
  >;
  canImportAllContacts?: Types.InputMaybe<Types.Scalars["Boolean"]>;
}>;

export type UpdateSetupMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
};

export const UpdateSetupDocument = gql`
  mutation UpdateSetup(
    $app_metadata_id: String!
    $app_mode: String!
    $whitelisted_addresses: [String!]
    $associated_domains: [String!]
    $contracts: [String!]
    $permit2_tokens: [String!]
    $canImportAllContacts: Boolean
  ) {
    update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: {
        app_mode: $app_mode
        whitelisted_addresses: $whitelisted_addresses
        associated_domains: $associated_domains
        contracts: $contracts
        permit2_tokens: $permit2_tokens
        canImportAllContacts: $canImportAllContacts
      }
    ) {
      id
    }
  }
`;
export type UpdateSetupMutationFn = Apollo.MutationFunction<
  UpdateSetupMutation,
  UpdateSetupMutationVariables
>;

/**
 * __useUpdateSetupMutation__
 *
 * To run a mutation, you first call `useUpdateSetupMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateSetupMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateSetupMutation, { data, loading, error }] = useUpdateSetupMutation({
 *   variables: {
 *      app_metadata_id: // value for 'app_metadata_id'
 *      app_mode: // value for 'app_mode'
 *      whitelisted_addresses: // value for 'whitelisted_addresses'
 *      associated_domains: // value for 'associated_domains'
 *      contracts: // value for 'contracts'
 *      permit2_tokens: // value for 'permit2_tokens'
 *      canImportAllContacts: // value for 'canImportAllContacts'
 *   },
 * });
 */
export function useUpdateSetupMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateSetupMutation,
    UpdateSetupMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<UpdateSetupMutation, UpdateSetupMutationVariables>(
    UpdateSetupDocument,
    options,
  );
}
export type UpdateSetupMutationHookResult = ReturnType<
  typeof useUpdateSetupMutation
>;
export type UpdateSetupMutationResult =
  Apollo.MutationResult<UpdateSetupMutation>;
export type UpdateSetupMutationOptions = Apollo.BaseMutationOptions<
  UpdateSetupMutation,
  UpdateSetupMutationVariables
>;
