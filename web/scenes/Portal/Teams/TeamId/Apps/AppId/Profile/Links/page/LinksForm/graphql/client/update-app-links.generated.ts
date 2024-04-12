/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpdateAppLinksInfoMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"];
  integration_url: Types.Scalars["String"];
  app_website_url: Types.Scalars["String"];
  source_code_url: Types.Scalars["String"];
  world_app_button_text: Types.Scalars["String"];
}>;

export type UpdateAppLinksInfoMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
};

export const UpdateAppLinksInfoDocument = gql`
  mutation UpdateAppLinksInfo(
    $app_metadata_id: String!
    $integration_url: String!
    $app_website_url: String!
    $source_code_url: String!
    $world_app_button_text: String!
  ) {
    update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: {
        integration_url: $integration_url
        app_website_url: $app_website_url
        source_code_url: $source_code_url
        world_app_button_text: $world_app_button_text
      }
    ) {
      id
    }
  }
`;
export type UpdateAppLinksInfoMutationFn = Apollo.MutationFunction<
  UpdateAppLinksInfoMutation,
  UpdateAppLinksInfoMutationVariables
>;

/**
 * __useUpdateAppLinksInfoMutation__
 *
 * To run a mutation, you first call `useUpdateAppLinksInfoMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateAppLinksInfoMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateAppLinksInfoMutation, { data, loading, error }] = useUpdateAppLinksInfoMutation({
 *   variables: {
 *      app_metadata_id: // value for 'app_metadata_id'
 *      integration_url: // value for 'integration_url'
 *      app_website_url: // value for 'app_website_url'
 *      source_code_url: // value for 'source_code_url'
 *      world_app_button_text: // value for 'world_app_button_text'
 *   },
 * });
 */
export function useUpdateAppLinksInfoMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateAppLinksInfoMutation,
    UpdateAppLinksInfoMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateAppLinksInfoMutation,
    UpdateAppLinksInfoMutationVariables
  >(UpdateAppLinksInfoDocument, options);
}
export type UpdateAppLinksInfoMutationHookResult = ReturnType<
  typeof useUpdateAppLinksInfoMutation
>;
export type UpdateAppLinksInfoMutationResult =
  Apollo.MutationResult<UpdateAppLinksInfoMutation>;
export type UpdateAppLinksInfoMutationOptions = Apollo.BaseMutationOptions<
  UpdateAppLinksInfoMutation,
  UpdateAppLinksInfoMutationVariables
>;
