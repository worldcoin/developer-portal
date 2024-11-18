/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetHighlightsQueryVariables = Types.Exact<{
  limit: Types.Scalars["Int"]["input"];
  offset: Types.Scalars["Int"]["input"];
  highlightsIds?: Types.InputMaybe<
    Array<Types.Scalars["String"]["input"]> | Types.Scalars["String"]["input"]
  >;
  locale: Types.Scalars["String"]["input"];
}>;

export type GetHighlightsQuery = {
  __typename?: "query_root";
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
    can_import_all_contacts: boolean;
    is_reviewer_world_app_approved: boolean;
    verification_status: string;
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

export const GetHighlightsDocument = gql`
  query GetHighlights(
    $limit: Int!
    $offset: Int!
    $highlightsIds: [String!]
    $locale: String!
  ) {
    highlights: app_metadata(
      where: {
        app_id: { _in: $highlightsIds }
        verification_status: { _eq: "verified" }
        is_reviewer_world_app_approved: { _eq: true }
        app: { is_banned: { _eq: false } }
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
      can_import_all_contacts
      is_reviewer_world_app_approved
      verification_status
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
    GetHighlights(
      variables: GetHighlightsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetHighlightsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetHighlightsQuery>(GetHighlightsDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "GetHighlights",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
