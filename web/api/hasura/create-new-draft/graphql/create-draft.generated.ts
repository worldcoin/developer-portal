/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type CreateDraftMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"];
  name?: Types.InputMaybe<Types.Scalars["String"]>;
  short_name?: Types.InputMaybe<Types.Scalars["String"]>;
  logo_img_url?: Types.InputMaybe<Types.Scalars["String"]>;
  showcase_img_urls?: Types.InputMaybe<
    Array<Types.Scalars["String"]> | Types.Scalars["String"]
  >;
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
  contracts?: Types.InputMaybe<
    Array<Types.Scalars["String"]> | Types.Scalars["String"]
  >;
  permit2_tokens?: Types.InputMaybe<
    Array<Types.Scalars["String"]> | Types.Scalars["String"]
  >;
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
    $showcase_img_urls: [String!] = null
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
    $whitelisted_addresses: [String!] = null
    $support_link: String = ""
    $supported_countries: [String!] = null
    $supported_languages: [String!] = null
    $associated_domains: [String!] = null
    $contracts: [String!] = null
    $permit2_tokens: [String!] = null
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
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType,
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
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
