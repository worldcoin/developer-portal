/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchAppMetadataByIdQueryVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
}>;

export type FetchAppMetadataByIdQuery = {
  __typename?: "query_root";
  app_metadata: Array<{
    __typename?: "app_metadata";
    id: string;
    app_id: string;
    name: string;
    short_name: string;
    logo_img_url: string;
    showcase_img_urls?: Array<string> | null;
    meta_tag_image_url: string;
    world_app_description: string;
    description: string;
    category: string;
    app_website_url: string;
    support_link: string;
    supported_countries?: Array<string> | null;
    supported_languages?: Array<string> | null;
    is_android_only: boolean;
    is_for_humans_only: boolean;
    verification_status: string;
    content_card_image_url: string;
    app: { __typename?: "app"; is_staging: boolean };
  }>;
  localisations: Array<{
    __typename?: "localisations";
    locale: string;
    name: string;
    short_name: string;
    world_app_description: string;
    description: string;
    meta_tag_image_url: string;
    showcase_img_urls?: Array<string> | null;
  }>;
};

export const FetchAppMetadataByIdDocument = gql`
  query FetchAppMetadataById($app_metadata_id: String!) {
    app_metadata(
      where: {
        _and: [
          { app: { deleted_at: { _is_null: true } } }
          { id: { _eq: $app_metadata_id } }
          { verification_status: { _eq: "unverified" } }
        ]
      }
    ) {
      id
      app_id
      name
      short_name
      logo_img_url
      showcase_img_urls
      meta_tag_image_url
      world_app_description
      description
      category
      app_website_url
      support_link
      supported_countries
      supported_languages
      is_android_only
      is_for_humans_only
      verification_status
      content_card_image_url
      app {
        is_staging
      }
    }
    localisations(where: { app_metadata_id: { _eq: $app_metadata_id } }) {
      locale
      name
      short_name
      world_app_description
      description
      meta_tag_image_url
      showcase_img_urls
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
    FetchAppMetadataById(
      variables: FetchAppMetadataByIdQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAppMetadataByIdQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAppMetadataByIdQuery>(
            FetchAppMetadataByIdDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchAppMetadataById",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
