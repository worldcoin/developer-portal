/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type FetchAppMetadataQueryVariables = Types.Exact<{
  team_id: Types.Scalars["String"];
  app_id: Types.Scalars["String"];
  user_id: Types.Scalars["String"];
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
      }
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
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
