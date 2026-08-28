/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchReviewerLiveMetadataQueryVariables = Types.Exact<{
  appId: Types.Scalars["String"]["input"];
}>;

export type FetchReviewerLiveMetadataQuery = {
  __typename?: "query_root";
  app_metadata: Array<{
    __typename?: "app_metadata";
    id: string;
    app_id: string;
    app_mode: string;
    app_website_url: string;
    associated_domains?: Array<string> | null;
    can_import_all_contacts: boolean;
    can_use_attestation: boolean;
    category: string;
    content_card_image_url: string;
    contracts?: Array<string> | null;
    created_at: string;
    description: string;
    hero_image_url: string;
    integration_url: string;
    is_allowed_unlimited_notifications?: boolean | null;
    is_android_only: boolean;
    is_developer_allow_listing: boolean;
    is_for_humans_only: boolean;
    is_reviewer_app_store_approved: boolean;
    is_reviewer_world_app_approved: boolean;
    logo_img_url: string;
    max_notifications_per_day?: number | null;
    meta_tag_image_url: string;
    name: string;
    permit2_tokens?: Array<string> | null;
    short_name: string;
    should_uninstall_on_delist: boolean;
    showcase_img_urls?: Array<string> | null;
    source_code_url: string;
    support_link: string;
    supported_countries?: Array<string> | null;
    supported_languages?: Array<string> | null;
    verification_status: string;
    verified_at?: string | null;
    whitelisted_addresses?: Array<string> | null;
    world_app_button_text: string;
    world_app_description: string;
    localisations: Array<{
      __typename?: "localisations";
      id: string;
      app_metadata_id: string;
      locale: string;
      name: string;
      short_name: string;
      world_app_button_text: string;
      world_app_description: string;
      description: string;
      hero_image_url: string;
      meta_tag_image_url: string;
      showcase_img_urls?: Array<string> | null;
      created_at: string;
      updated_at: string;
    }>;
  }>;
};

export const FetchReviewerLiveMetadataDocument = gql`
  query FetchReviewerLiveMetadata($appId: String!) {
    app_metadata(
      where: {
        app_id: { _eq: $appId }
        verification_status: { _eq: "verified" }
        is_reviewer_world_app_approved: { _eq: true }
      }
      order_by: { verified_at: desc }
      limit: 1
    ) {
      id
      app_id
      app_mode
      app_website_url
      associated_domains
      can_import_all_contacts
      can_use_attestation
      category
      content_card_image_url
      contracts
      created_at
      description
      hero_image_url
      integration_url
      is_allowed_unlimited_notifications
      is_android_only
      is_developer_allow_listing
      is_for_humans_only
      is_reviewer_app_store_approved
      is_reviewer_world_app_approved
      logo_img_url
      max_notifications_per_day
      meta_tag_image_url
      name
      permit2_tokens
      short_name
      should_uninstall_on_delist
      showcase_img_urls
      source_code_url
      support_link
      supported_countries
      supported_languages
      verification_status
      verified_at
      whitelisted_addresses
      world_app_button_text
      world_app_description
      localisations(order_by: [{ locale: asc }, { id: asc }]) {
        id
        app_metadata_id
        locale
        name
        short_name
        world_app_button_text
        world_app_description
        description
        hero_image_url
        meta_tag_image_url
        showcase_img_urls
        created_at
        updated_at
      }
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
    FetchReviewerLiveMetadata(
      variables: FetchReviewerLiveMetadataQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchReviewerLiveMetadataQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchReviewerLiveMetadataQuery>(
            FetchReviewerLiveMetadataDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchReviewerLiveMetadata",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
