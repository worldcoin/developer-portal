/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type McpUpdateAppMetadataMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  expected_verification_status: Types.Scalars["String"]["input"];
  expected_metadata_updated_at: Types.Scalars["timestamptz"]["input"];
  set: Types.Scalars["jsonb"]["input"];
  actor_subject: Types.Scalars["String"]["input"];
  actor_email?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type McpUpdateAppMetadataMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk: Array<{
    __typename?: "app_metadata";
    id: string;
    app_id: string;
    updated_at: string;
    name: string;
    short_name: string;
    app_mode: string;
    category: string;
    integration_url: string;
    app_website_url: string;
    support_link: string;
    content_card_image_url: string;
    description: string;
    hero_image_url: string;
    is_android_only: boolean;
    is_for_humans_only: boolean;
    logo_img_url: string;
    meta_tag_image_url: string;
    showcase_img_urls?: Array<string> | null;
    world_app_description: string;
    world_app_button_text: string;
    verification_status: string;
    supported_countries?: Array<string> | null;
    supported_languages?: Array<string> | null;
    is_developer_allow_listing: boolean;
    contracts?: Array<string> | null;
    permit2_tokens?: Array<string> | null;
    whitelisted_addresses?: Array<string> | null;
    associated_domains?: Array<string> | null;
    can_import_all_contacts: boolean;
    can_use_attestation: boolean;
    is_allowed_unlimited_notifications?: boolean | null;
    max_notifications_per_day?: number | null;
  }>;
};

export const McpUpdateAppMetadataDocument = gql`
  mutation McpUpdateAppMetadata(
    $app_metadata_id: String!
    $expected_verification_status: String!
    $expected_metadata_updated_at: timestamptz!
    $set: jsonb!
    $actor_subject: String!
    $actor_email: String
  ) {
    update_app_metadata_by_pk: mcp_patch_editable_app_metadata(
      args: {
        p_app_metadata_id: $app_metadata_id
        p_expected_verification_status: $expected_verification_status
        p_expected_metadata_updated_at: $expected_metadata_updated_at
        p_patch: $set
        p_actor_subject: $actor_subject
        p_actor_email: $actor_email
      }
    ) {
      id
      app_id
      updated_at
      name
      short_name
      app_mode
      category
      integration_url
      app_website_url
      support_link
      content_card_image_url
      description
      hero_image_url
      is_android_only
      is_for_humans_only
      logo_img_url
      meta_tag_image_url
      showcase_img_urls
      world_app_description
      world_app_button_text
      verification_status
      supported_countries
      supported_languages
      is_developer_allow_listing
      contracts
      permit2_tokens
      whitelisted_addresses
      associated_domains
      can_import_all_contacts
      can_use_attestation
      is_allowed_unlimited_notifications
      max_notifications_per_day
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
    McpUpdateAppMetadata(
      variables: McpUpdateAppMetadataMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<McpUpdateAppMetadataMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<McpUpdateAppMetadataMutation>(
            McpUpdateAppMetadataDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "McpUpdateAppMetadata",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
