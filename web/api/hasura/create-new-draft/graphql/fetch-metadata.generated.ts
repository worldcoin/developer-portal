/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchAppMetadataQueryVariables = Types.Exact<{
  team_id: Types.Scalars["String"]["input"];
  app_id: Types.Scalars["String"]["input"];
  user_id: Types.Scalars["String"]["input"];
}>;

export type FetchAppMetadataQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    verified_app_metadata: Array<{
      __typename?: "app_metadata";
      id: string;
      app_id: string;
      name: string;
      logo_img_url: string;
      showcase_img_urls?: Array<string> | null;
      hero_image_url: string;
      description: string;
      world_app_description: string;
      category: string;
      is_developer_allow_listing: boolean;
      world_app_button_text: string;
      integration_url: string;
      app_website_url: string;
      source_code_url: string;
      verification_status: string;
      app_mode: string;
      whitelisted_addresses?: Array<string> | null;
      support_link: string;
      supported_countries?: Array<string> | null;
      supported_languages?: Array<string> | null;
      short_name: string;
      associated_domains?: Array<string> | null;
      contracts?: Array<string> | null;
      permit2_tokens?: Array<string> | null;
      can_import_all_contacts: boolean;
      is_allowed_unlimited_notifications?: boolean | null;
      max_notifications_per_day?: number | null;
      is_android_only: boolean;
      is_for_humans_only: boolean;
    }>;
  }>;
};

export const FetchAppMetadataDocument = gql`
  query FetchAppMetadata(
    $team_id: String!
    $app_id: String!
    $user_id: String!
  ) {
    app(
      where: {
        id: { _eq: $app_id }
        is_banned: { _eq: false }
        team: {
          id: { _eq: $team_id }
          memberships: { user_id: { _eq: $user_id }, role: { _neq: MEMBER } }
        }
      }
    ) {
      verified_app_metadata: app_metadata(
        where: { verification_status: { _eq: "verified" } }
      ) {
        id
        app_id
        name
        logo_img_url
        showcase_img_urls
        hero_image_url
        description
        world_app_description
        category
        is_developer_allow_listing
        world_app_button_text
        integration_url
        app_website_url
        source_code_url
        verification_status
        app_mode
        whitelisted_addresses
        support_link
        supported_countries
        supported_languages
        short_name
        associated_domains
        contracts
        permit2_tokens
        can_import_all_contacts
        is_allowed_unlimited_notifications
        max_notifications_per_day
        is_android_only
        is_for_humans_only
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
    FetchAppMetadata(
      variables: FetchAppMetadataQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAppMetadataQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAppMetadataQuery>(
            FetchAppMetadataDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchAppMetadata",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
