/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type GetAppMetadataQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"];
}>;

export type GetAppMetadataQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    app_metadata: Array<{
      __typename?: "app_metadata";
      id: string;
      logo_img_url: string;
      showcase_img_urls?: any | null;
      hero_image_url: string;
      verification_status: string;
    }>;
  }>;
};

export const GetAppMetadataDocument = gql`
  query GetAppMetadata($app_id: String!) {
    app(where: { id: { _eq: $app_id } }) {
      app_metadata {
        id
        logo_img_url
        showcase_img_urls
        hero_image_url
        verification_status
      }
    }
  }
`;

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType
) => action();

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper
) {
  return {
    GetAppMetadata(
      variables: GetAppMetadataQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders
    ): Promise<GetAppMetadataQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetAppMetadataQuery>(
            GetAppMetadataDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders }
          ),
        "GetAppMetadata",
        "query"
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
