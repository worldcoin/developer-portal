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
    name: string;
    app_id: string;
    logo_img_url: string;
    showcase_img_urls?: any | null;
    hero_image_url: string;
    world_app_description: string;
    description: string;
    category: string;
    integration_url: string;
    app_website_url: string;
    source_code_url: string;
    app: {
      __typename?: "app";
      team: { __typename?: "team"; name?: string | null };
    };
  }>;
  unranked_apps: Array<{
    __typename?: "app_metadata";
    name: string;
    app_id: string;
    logo_img_url: string;
    showcase_img_urls?: any | null;
    hero_image_url: string;
    world_app_description: string;
    description: string;
    category: string;
    integration_url: string;
    app_website_url: string;
    source_code_url: string;
    app: {
      __typename?: "app";
      team: { __typename?: "team"; name?: string | null };
    };
  }>;
};

export const GetAppMetadataDocument = gql`
  query GetAppMetadata($app_ids: [String!], $limit: Int!, $offset: Int!) {
    ranked_apps: app_metadata(
      where: {
        app_id: { _in: $app_ids }
        verification_status: { _eq: "verified" }
        _or: [
          { is_reviewer_app_store_approved: { _eq: true } }
          { is_reviewer_world_app_approved: { _eq: true } }
        ]
      }
    ) {
      name
      app_id
      logo_img_url
      showcase_img_urls
      hero_image_url
      world_app_description
      description
      category
      integration_url
      app_website_url
      source_code_url
      app {
        team {
          name
        }
      }
    }
    unranked_apps: app_metadata(
      where: {
        app_id: { _nin: $app_ids }
        verification_status: { _eq: "verified" }
        _or: [
          { is_reviewer_app_store_approved: { _eq: true } }
          { is_reviewer_world_app_approved: { _eq: true } }
        ]
      }
      limit: $limit
      offset: $offset
    ) {
      name
      app_id
      logo_img_url
      showcase_img_urls
      hero_image_url
      world_app_description
      description
      category
      integration_url
      app_website_url
      source_code_url
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
