/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type GetAppMetadataQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"];
  locale: Types.Scalars["String"];
}>;

export type GetAppMetadataQuery = {
  __typename?: "query_root";
  app_metadata: Array<{
    __typename?: "app_metadata";
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
    app_rating?: number | null;
    associated_domains?: Array<string> | null;
    verification_status: string;
    contracts?: Array<string> | null;
    permit2_tokens?: Array<string> | null;
    canImportAllContacts: boolean;
    is_reviewer_world_app_approved: boolean;
    localisations: Array<{
      __typename?: "localisations";
      name: string;
      world_app_button_text: string;
      world_app_description: string;
      short_name: string;
      description: string;
    }>;
    app: {
      __typename?: "app";
      team: { __typename?: "team"; name?: string | null };
    };
  }>;
};

export const GetAppMetadataDocument = gql`
  query GetAppMetadata($app_id: String!, $locale: String!) {
    app_metadata(where: { app_id: { _eq: $app_id } }) {
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
      app_rating
      associated_domains
      verification_status
      contracts
      permit2_tokens
      canImportAllContacts
      is_reviewer_world_app_approved
      localisations(where: { locale: { _eq: $locale } }) {
        name
        world_app_button_text
        world_app_description
        short_name
        description
      }
      app {
        team {
          name
        }
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
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
