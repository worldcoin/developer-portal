/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetAppMetadataQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
}>;

export type GetAppMetadataQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    first_verified_at?: string | null;
    app_metadata: Array<{
      __typename?: "app_metadata";
      id: string;
      logo_img_url: string;
      showcase_img_urls?: Array<string> | null;
      hero_image_url: string;
      meta_tag_image_url: string;
      content_card_image_url: string;
      verification_status: string;
      localisations: Array<{
        __typename?: "localisations";
        id: string;
        locale: string;
        hero_image_url: string;
        showcase_img_urls?: Array<string> | null;
        meta_tag_image_url: string;
      }>;
    }>;
  }>;
};

export const GetAppMetadataDocument = gql`
  query GetAppMetadata($app_id: String!) {
    app(where: { id: { _eq: $app_id } }) {
      first_verified_at
      app_metadata {
        id
        logo_img_url
        showcase_img_urls
        hero_image_url
        meta_tag_image_url
        content_card_image_url
        verification_status
        localisations {
          id
          locale
          hero_image_url
          showcase_img_urls
          meta_tag_image_url
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
