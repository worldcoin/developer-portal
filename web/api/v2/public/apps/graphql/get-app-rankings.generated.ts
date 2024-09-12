/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type GetAppsQueryVariables = Types.Exact<{
  topAppsConditions:
    | Array<Types.InputMaybe<Types.App_Metadata_Bool_Exp>>
    | Types.InputMaybe<Types.App_Metadata_Bool_Exp>;
  limit: Types.Scalars["Int"];
  offset: Types.Scalars["Int"];
  highlightsIds:
    | Array<Types.InputMaybe<Types.Scalars["String"]>>
    | Types.InputMaybe<Types.Scalars["String"]>;
  locale: Types.Scalars["String"];
}>;

export type GetAppsQuery = {
  __typename?: "query_root";
  top_apps: Array<{
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
    associated_domains?: Array<string> | null;
    contracts?: Array<string> | null;
    permit2_tokens?: Array<string> | null;
    canImportAllContacts?: boolean | null;
    app_rating?: number | null;
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
  highlights: Array<{
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
    associated_domains?: Array<string> | null;
    contracts?: Array<string> | null;
    permit2_tokens?: Array<string> | null;
    canImportAllContacts?: boolean | null;
    app_rating?: number | null;
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

export const GetAppsDocument = gql`
  query GetApps(
    $topAppsConditions: [app_metadata_bool_exp]!
    $limit: Int!
    $offset: Int!
    $highlightsIds: [String]!
    $locale: String!
  ) {
    top_apps: app_metadata(
      where: {
        _and: $topAppsConditions
        _or: [
          { is_reviewer_app_store_approved: { _eq: true } }
          { is_reviewer_world_app_approved: { _eq: true } }
        ]
      }
      limit: $limit
      offset: $offset
    ) {
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
      canImportAllContacts
      localisations(where: { locale: { _eq: $locale } }) {
        name
        world_app_button_text
        world_app_description
        short_name
        description
      }
      app_rating
      app {
        team {
          name
        }
      }
    }
    highlights: app_metadata(
      where: {
        app_id: { _in: $highlightsIds }
        verification_status: { _eq: "verified" }
        is_reviewer_app_store_approved: { _eq: true }
        is_reviewer_world_app_approved: { _eq: true }
      }
    ) {
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
      canImportAllContacts
      localisations(where: { locale: { _eq: $locale } }) {
        name
        world_app_button_text
        world_app_description
        short_name
        description
      }
      app_rating
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
    GetApps(
      variables: GetAppsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetAppsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetAppsQuery>(GetAppsDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "GetApps",
        "query",
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
