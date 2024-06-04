/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type CreateEditableRowMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"];
  name?: Types.InputMaybe<Types.Scalars["String"]>;
  logo_img_url?: Types.InputMaybe<Types.Scalars["String"]>;
  showcase_img_urls?: Types.InputMaybe<Types.Scalars["_text"]>;
  hero_image_url?: Types.InputMaybe<Types.Scalars["String"]>;
  description?: Types.InputMaybe<Types.Scalars["String"]>;
  world_app_description?: Types.InputMaybe<Types.Scalars["String"]>;
  category?: Types.InputMaybe<Types.Scalars["String"]>;
  is_developer_allow_listing?: Types.InputMaybe<Types.Scalars["Boolean"]>;
  integration_url?: Types.InputMaybe<Types.Scalars["String"]>;
  app_website_url?: Types.InputMaybe<Types.Scalars["String"]>;
  source_code_url?: Types.InputMaybe<Types.Scalars["String"]>;
  verification_status?: Types.InputMaybe<Types.Scalars["String"]>;
  world_app_button_text?: Types.InputMaybe<Types.Scalars["String"]>;
  app_mode?: Types.InputMaybe<Types.Scalars["String"]>;
  whitelisted_addresses?: Types.InputMaybe<Types.Scalars["_text"]>;
  support_email?: Types.InputMaybe<Types.Scalars["String"]>;
  supported_countries?: Types.InputMaybe<Types.Scalars["_text"]>;
}>;

export type CreateEditableRowMutation = {
  __typename?: "mutation_root";
  insert_app_metadata_one?: { __typename?: "app_metadata"; id: string } | null;
};

export const CreateEditableRowDocument = gql`
  mutation CreateEditableRow(
    $app_id: String!
    $name: String
    $logo_img_url: String = ""
    $showcase_img_urls: _text = null
    $hero_image_url: String = ""
    $description: String = ""
    $world_app_description: String = ""
    $category: String = ""
    $is_developer_allow_listing: Boolean
    $integration_url: String = ""
    $app_website_url: String = ""
    $source_code_url: String = ""
    $verification_status: String = ""
    $world_app_button_text: String = ""
    $app_mode: String = ""
    $whitelisted_addresses: _text = null
    $support_email: String = null
    $supported_countries: _text = null
  ) {
    insert_app_metadata_one(
      object: {
        app_id: $app_id
        name: $name
        logo_img_url: $logo_img_url
        showcase_img_urls: $showcase_img_urls
        hero_image_url: $hero_image_url
        description: $description
        world_app_description: $world_app_description
        category: $category
        is_developer_allow_listing: $is_developer_allow_listing
        integration_url: $integration_url
        app_website_url: $app_website_url
        source_code_url: $source_code_url
        verification_status: $verification_status
        world_app_button_text: $world_app_button_text
        app_mode: $app_mode
        whitelisted_addresses: $whitelisted_addresses
        support_email: $support_email
        supported_countries: $supported_countries
      }
      on_conflict: {
        constraint: app_metadata_app_id_is_row_verified_key
        update_columns: [
          name
          logo_img_url
          showcase_img_urls
          hero_image_url
          description
          world_app_description
          category
          is_developer_allow_listing
          integration_url
          app_website_url
          source_code_url
          verification_status
          world_app_button_text
          app_mode
          whitelisted_addresses
          support_email
          supported_countries
        ]
        where: { verification_status: { _neq: "verified" } }
      }
    ) {
      id
    }
  }
`;
export type CreateEditableRowMutationFn = Apollo.MutationFunction<
  CreateEditableRowMutation,
  CreateEditableRowMutationVariables
>;

/**
 * __useCreateEditableRowMutation__
 *
 * To run a mutation, you first call `useCreateEditableRowMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateEditableRowMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createEditableRowMutation, { data, loading, error }] = useCreateEditableRowMutation({
 *   variables: {
 *      app_id: // value for 'app_id'
 *      name: // value for 'name'
 *      logo_img_url: // value for 'logo_img_url'
 *      showcase_img_urls: // value for 'showcase_img_urls'
 *      hero_image_url: // value for 'hero_image_url'
 *      description: // value for 'description'
 *      world_app_description: // value for 'world_app_description'
 *      category: // value for 'category'
 *      is_developer_allow_listing: // value for 'is_developer_allow_listing'
 *      integration_url: // value for 'integration_url'
 *      app_website_url: // value for 'app_website_url'
 *      source_code_url: // value for 'source_code_url'
 *      verification_status: // value for 'verification_status'
 *      world_app_button_text: // value for 'world_app_button_text'
 *      app_mode: // value for 'app_mode'
 *      whitelisted_addresses: // value for 'whitelisted_addresses'
 *      support_email: // value for 'support_email'
 *      supported_countries: // value for 'supported_countries'
 *   },
 * });
 */
export function useCreateEditableRowMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CreateEditableRowMutation,
    CreateEditableRowMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    CreateEditableRowMutation,
    CreateEditableRowMutationVariables
  >(CreateEditableRowDocument, options);
}
export type CreateEditableRowMutationHookResult = ReturnType<
  typeof useCreateEditableRowMutation
>;
export type CreateEditableRowMutationResult =
  Apollo.MutationResult<CreateEditableRowMutation>;
export type CreateEditableRowMutationOptions = Apollo.BaseMutationOptions<
  CreateEditableRowMutation,
  CreateEditableRowMutationVariables
>;
