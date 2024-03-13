/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type GetAppMetadataQueryVariables = Types.Exact<{
  app_ids?: Types.InputMaybe<
    Array<Types.Scalars["String"]> | Types.Scalars["String"]
  >;
  limit: Types.Scalars["Int"];
  offset: Types.Scalars["Int"];
}>;

export type GetAppMetadataQuery = {
  __typename?: "query_root";
  ranked_apps: Array<{
    __typename?: "app_metadata";
    app_id: string;
    logo_img_url: string;
    name: string;
    integration_url: string;
    world_app_description: string;
    category: string;
  }>;
  unranked_apps: Array<{
    __typename?: "app_metadata";
    app_id: string;
    logo_img_url: string;
    name: string;
    integration_url: string;
    world_app_description: string;
    category: string;
  }>;
};

export const GetAppMetadataDocument = gql`
  query GetAppMetadata($app_ids: [String!], $limit: Int!, $offset: Int!) {
    ranked_apps: app_metadata(
      where: {
        app_id: { _in: $app_ids }
        verification_status: { _eq: "verified" }
      }
    ) {
      app_id
      logo_img_url
      name
      integration_url
      world_app_description
      category
    }
    unranked_apps: app_metadata(
      where: {
        app_id: { _nin: $app_ids }
        verification_status: { _eq: "verified" }
      }
      limit: $limit
      offset: $offset
    ) {
      app_id
      logo_img_url
      name
      integration_url
      world_app_description
      category
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
