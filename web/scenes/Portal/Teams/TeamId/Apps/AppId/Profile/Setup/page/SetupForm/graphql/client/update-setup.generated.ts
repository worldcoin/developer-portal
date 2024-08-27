/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpdateSetupMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"];
  app_id: Types.Scalars["String"];
  app_mode: Types.Scalars["String"];
  whitelisted_addresses?: Types.InputMaybe<
    Array<Types.Scalars["String"]> | Types.Scalars["String"]
  >;
  support_link?: Types.InputMaybe<Types.Scalars["String"]>;
  supported_countries?: Types.InputMaybe<
    Array<Types.Scalars["String"]> | Types.Scalars["String"]
  >;
  supported_languages?: Types.InputMaybe<
    Array<Types.Scalars["String"]> | Types.Scalars["String"]
  >;
  associated_domains?: Types.InputMaybe<
    Array<Types.Scalars["String"]> | Types.Scalars["String"]
  >;
  status: Types.Scalars["String"];
}>;

export type UpdateSetupMutation = {
  __typename?: "mutation_root";
  update_app_by_pk?: { __typename?: "app"; id: string } | null;
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
};

export const UpdateSetupDocument = gql`
  mutation UpdateSetup(
    $app_metadata_id: String!
    $app_id: String!
    $app_mode: String!
    $whitelisted_addresses: [String!]
    $support_link: String
    $supported_countries: [String!]
    $supported_languages: [String!]
    $associated_domains: [String!]
    $status: String!
  ) {
    update_app_by_pk(pk_columns: { id: $app_id }, _set: { status: $status }) {
      id
    }
    update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: {
        app_mode: $app_mode
        whitelisted_addresses: $whitelisted_addresses
        support_link: $support_link
        supported_countries: $supported_countries
        supported_languages: $supported_languages
        associated_domains: $associated_domains
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
 *      app_id: // value for 'app_id'
 *      app_mode: // value for 'app_mode'
 *      whitelisted_addresses: // value for 'whitelisted_addresses'
 *      support_link: // value for 'support_link'
 *      supported_countries: // value for 'supported_countries'
 *      supported_languages: // value for 'supported_languages'
 *      associated_domains: // value for 'associated_domains'
 *      status: // value for 'status'
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
