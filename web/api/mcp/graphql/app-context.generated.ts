/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type McpAppContextQueryVariables = Types.Exact<{
  team_id: Types.Scalars["String"]["input"];
  app_id: Types.Scalars["String"]["input"];
}>;

export type McpAppContextQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    id: string;
    name: string;
    engine: string;
    is_staging: boolean;
    status: string;
    app_metadata: Array<{
      __typename?: "app_metadata";
      id: string;
      name: string;
      short_name: string;
      app_mode: string;
      category: string;
      content_card_image_url: string;
      description: string;
      hero_image_url: string;
      integration_url: string;
      is_android_only: boolean;
      app_website_url: string;
      is_for_humans_only: boolean;
      logo_img_url: string;
      meta_tag_image_url: string;
      support_link: string;
      showcase_img_urls?: Array<string> | null;
      world_app_description: string;
      world_app_button_text: string;
      verification_status: string;
      is_developer_allow_listing: boolean;
      supported_countries?: Array<string> | null;
      supported_languages?: Array<string> | null;
    }>;
    rp_registration: Array<{
      __typename?: "rp_registration";
      rp_id: string;
      mode: unknown;
      status: unknown;
      signer_address?: string | null;
      staging_status?: unknown | null;
      actions_v4: Array<{
        __typename?: "action_v4";
        id: string;
        action: string;
        description: string;
        environment: unknown;
      }>;
    }>;
  }>;
};

export const McpAppContextDocument = gql`
  query McpAppContext($team_id: String!, $app_id: String!) {
    app(
      where: {
        id: { _eq: $app_id }
        team_id: { _eq: $team_id }
        deleted_at: { _is_null: true }
      }
      limit: 1
    ) {
      id
      name
      engine
      is_staging
      status
      app_metadata(
        where: { verification_status: { _neq: "verified" } }
        order_by: { created_at: desc }
        limit: 1
      ) {
        id
        name
        short_name
        app_mode
        category
        content_card_image_url
        description
        hero_image_url
        integration_url
        is_android_only
        app_website_url
        is_for_humans_only
        logo_img_url
        meta_tag_image_url
        support_link
        showcase_img_urls
        world_app_description
        world_app_button_text
        verification_status
        is_developer_allow_listing
        supported_countries
        supported_languages
      }
      rp_registration {
        rp_id
        mode
        status
        signer_address
        staging_status
        actions_v4(order_by: { created_at: desc }) {
          id
          action
          description
          environment
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
    McpAppContext(
      variables: McpAppContextQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<McpAppContextQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<McpAppContextQuery>(McpAppContextDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "McpAppContext",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
