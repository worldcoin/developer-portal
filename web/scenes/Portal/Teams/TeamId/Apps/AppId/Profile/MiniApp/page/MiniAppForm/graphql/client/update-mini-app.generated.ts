/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpdateMiniAppInfoMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"];
  app_mode: Types.Scalars["String"];
  whitelisted_addresses?: Types.InputMaybe<Types.Scalars["_text"]>;
}>;

export type UpdateMiniAppInfoMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
};

export const UpdateMiniAppInfoDocument = gql`
  mutation UpdateMiniAppInfo(
    $app_metadata_id: String!
    $app_mode: String!
    $whitelisted_addresses: _text
  ) {
    update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: {
        app_mode: $app_mode
        whitelisted_addresses: $whitelisted_addresses
      }
    ) {
      id
    }
  }
`;
export type UpdateMiniAppInfoMutationFn = Apollo.MutationFunction<
  UpdateMiniAppInfoMutation,
  UpdateMiniAppInfoMutationVariables
>;

/**
 * __useUpdateMiniAppInfoMutation__
 *
 * To run a mutation, you first call `useUpdateMiniAppInfoMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateMiniAppInfoMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateMiniAppInfoMutation, { data, loading, error }] = useUpdateMiniAppInfoMutation({
 *   variables: {
 *      app_metadata_id: // value for 'app_metadata_id'
 *      app_mode: // value for 'app_mode'
 *      whitelisted_addresses: // value for 'whitelisted_addresses'
 *   },
 * });
 */
export function useUpdateMiniAppInfoMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateMiniAppInfoMutation,
    UpdateMiniAppInfoMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateMiniAppInfoMutation,
    UpdateMiniAppInfoMutationVariables
  >(UpdateMiniAppInfoDocument, options);
}
export type UpdateMiniAppInfoMutationHookResult = ReturnType<
  typeof useUpdateMiniAppInfoMutation
>;
export type UpdateMiniAppInfoMutationResult =
  Apollo.MutationResult<UpdateMiniAppInfoMutation>;
export type UpdateMiniAppInfoMutationOptions = Apollo.BaseMutationOptions<
  UpdateMiniAppInfoMutation,
  UpdateMiniAppInfoMutationVariables
>;
