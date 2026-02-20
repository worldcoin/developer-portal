/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type CreateDraftMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  name?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  short_name?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  logo_img_url?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  hero_image_url?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  meta_tag_image_url?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  showcase_img_urls?: Types.InputMaybe<
    Array<Types.Scalars["String"]["input"]> | Types.Scalars["String"]["input"]
  >;
  content_card_image_url?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  description?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  world_app_description?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  category?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  is_developer_allow_listing?: Types.InputMaybe<
    Types.Scalars["Boolean"]["input"]
  >;
  integration_url?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  app_website_url?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  source_code_url?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  verification_status?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  world_app_button_text?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  app_mode?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  whitelisted_addresses?: Types.InputMaybe<
    Array<Types.Scalars["String"]["input"]> | Types.Scalars["String"]["input"]
  >;
  support_link?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  supported_countries?: Types.InputMaybe<
    Array<Types.Scalars["String"]["input"]> | Types.Scalars["String"]["input"]
  >;
  supported_languages?: Types.InputMaybe<
    Array<Types.Scalars["String"]["input"]> | Types.Scalars["String"]["input"]
  >;
  associated_domains?: Types.InputMaybe<
    Array<Types.Scalars["String"]["input"]> | Types.Scalars["String"]["input"]
  >;
  contracts?: Types.InputMaybe<
    Array<Types.Scalars["String"]["input"]> | Types.Scalars["String"]["input"]
  >;
  permit2_tokens?: Types.InputMaybe<
    Array<Types.Scalars["String"]["input"]> | Types.Scalars["String"]["input"]
  >;
  can_import_all_contacts: Types.Scalars["Boolean"]["input"];
  can_use_attestation: Types.Scalars["Boolean"]["input"];
  is_allowed_unlimited_notifications: Types.Scalars["Boolean"]["input"];
  max_notifications_per_day: Types.Scalars["Int"]["input"];
  is_android_only: Types.Scalars["Boolean"]["input"];
  is_for_humans_only: Types.Scalars["Boolean"]["input"];
}>;

export type CreateDraftMutation = {
  __typename?: "mutation_root";
  insert_app_metadata_one?: { __typename?: "app_metadata"; id: string } | null;
};

export const CreateDraftDocument = gql`
  mutation CreateDraft(
    $app_id: String!
    $name: String = ""
    $short_name: String = ""
    $logo_img_url: String = ""
    $hero_image_url: String = ""
    $meta_tag_image_url: String = ""
    $showcase_img_urls: [String!] = null
    $content_card_image_url: String = ""
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
    $whitelisted_addresses: [String!] = null
    $support_link: String = ""
    $supported_countries: [String!] = null
    $supported_languages: [String!] = null
    $associated_domains: [String!] = null
    $contracts: [String!] = null
    $permit2_tokens: [String!] = null
    $can_import_all_contacts: Boolean!
    $can_use_attestation: Boolean!
    $is_allowed_unlimited_notifications: Boolean!
    $max_notifications_per_day: Int!
    $is_android_only: Boolean!
    $is_for_humans_only: Boolean!
  ) {
    insert_app_metadata_one(
      object: {
        app_id: $app_id
        name: $name
        logo_img_url: $logo_img_url
        showcase_img_urls: $showcase_img_urls
        meta_tag_image_url: $meta_tag_image_url
        hero_image_url: $hero_image_url
        content_card_image_url: $content_card_image_url
        description: $description
        world_app_description: $world_app_description
        category: $category
        is_developer_allow_listing: $is_developer_allow_listing
        world_app_button_text: $world_app_button_text
        integration_url: $integration_url
        app_website_url: $app_website_url
        source_code_url: $source_code_url
        verification_status: $verification_status
        app_mode: $app_mode
        whitelisted_addresses: $whitelisted_addresses
        support_link: $support_link
        supported_countries: $supported_countries
        supported_languages: $supported_languages
        short_name: $short_name
        associated_domains: $associated_domains
        contracts: $contracts
        permit2_tokens: $permit2_tokens
        can_import_all_contacts: $can_import_all_contacts
        can_use_attestation: $can_use_attestation
        is_allowed_unlimited_notifications: $is_allowed_unlimited_notifications
        max_notifications_per_day: $max_notifications_per_day
        is_android_only: $is_android_only
        is_for_humans_only: $is_for_humans_only
      }
    ) {
      id
    }
  }
`;

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string,
  variables?: any,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType,
  _variables,
) => action();

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper,
) {
  return {
    CreateDraft(
      variables: CreateDraftMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<CreateDraftMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CreateDraftMutation>(CreateDraftDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "CreateDraft",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
