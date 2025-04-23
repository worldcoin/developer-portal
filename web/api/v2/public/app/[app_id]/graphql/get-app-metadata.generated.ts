/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetAppMetadataQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  locale: Types.Scalars["String"]["input"];
}>;

export type GetAppMetadataQuery = {
  __typename?: "query_root";
  app_metadata: Array<{
    __typename?: "app_metadata";
    id: string;
    name: string;
    short_name: string;
    app_id: string;
    logo_img_url: string;
    showcase_img_urls?: Array<string> | null;
    hero_image_url: string;
    world_app_description: string;
    world_app_button_text: string;
    whitelisted_addresses?: Array<string> | null;
    app_mode: string;
    description: string;
    category: string;
    integration_url: string;
    app_website_url: string;
    source_code_url: string;
    support_link: string;
    supported_countries?: Array<string> | null;
    supported_languages?: Array<string> | null;
    associated_domains?: Array<string> | null;
    contracts?: Array<string> | null;
    permit2_tokens?: Array<string> | null;
    can_import_all_contacts: boolean;
    is_reviewer_world_app_approved: boolean;
    verification_status: string;
    is_allowed_unlimited_notifications?: boolean | null;
    max_notifications_per_day?: number | null;
    is_android_only: boolean;
    is_for_humans_only: boolean;
    localisations: Array<{
      __typename?: "localisations";
      name: string;
      world_app_button_text: string;
      world_app_description: string;
      short_name: string;
      description: string;
      hero_image_url: string;
      showcase_img_urls?: Array<string> | null;
    }>;
    app: {
      __typename?: "app";
      rating_sum: number;
      rating_count: number;
      team: { __typename?: "team"; name?: string | null; id: string };
    };
  }>;
};

export const GetAppMetadataDocument = gql`
  query GetAppMetadata($app_id: String!, $locale: String!) {
    app_metadata(
      where: { app_id: { _eq: $app_id }, app: { is_banned: { _eq: false } } }
    ) {
      id
      name
      short_name
      app_id
      logo_img_url
      showcase_img_urls
      hero_image_url
      world_app_description
      world_app_button_text
      whitelisted_addresses
      app_mode
      description
      category
      integration_url
      app_website_url
      source_code_url
      support_link
      supported_countries
      supported_languages
      associated_domains
      contracts
      permit2_tokens
      can_import_all_contacts
      is_reviewer_world_app_approved
      verification_status
      is_allowed_unlimited_notifications
      max_notifications_per_day
      is_android_only
      is_for_humans_only
      localisations(where: { locale: { _eq: $locale } }) {
        name
        world_app_button_text
        world_app_description
        short_name
        description
        hero_image_url
        showcase_img_urls
      }
      app {
        team {
          name
          id
        }
        rating_sum
        rating_count
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
    GetAppMetadata(
      variables: GetAppMetadataQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetAppMetadataQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetAppMetadataQuery>(
            GetAppMetadataDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetAppMetadata",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
