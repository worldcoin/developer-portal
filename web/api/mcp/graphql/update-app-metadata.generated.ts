/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type McpUpdateAppMetadataMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  set: Types.App_Metadata_Set_Input;
}>;

export type McpUpdateAppMetadataMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
    app_id: string;
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
  } | null;
};

export const McpUpdateAppMetadataDocument = gql`
  mutation McpUpdateAppMetadata(
    $app_metadata_id: String!
    $set: app_metadata_set_input!
  ) {
    update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: $set
    ) {
      id
      app_id
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
