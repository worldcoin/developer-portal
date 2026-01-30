/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchAppMetadataQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
}>;

export type FetchAppMetadataQuery = {
  __typename?: "query_root";
  app_by_pk?: {
    __typename?: "app";
    id: string;
    app_metadata: Array<{
      __typename?: "app_metadata";
      name: string;
      integration_url: string;
    }>;
    verified_app_metadata: Array<{
      __typename?: "app_metadata";
      name: string;
      logo_img_url: string;
      integration_url: string;
    }>;
  } | null;
};

export const FetchAppMetadataDocument = gql`
  query FetchAppMetadata($app_id: String!) {
    app_by_pk(id: $app_id) {
      id
      app_metadata(where: { verification_status: { _neq: "verified" } }) {
        name
        integration_url
      }
      verified_app_metadata: app_metadata(
        where: { verification_status: { _eq: "verified" } }
      ) {
        name
        logo_img_url
        integration_url
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
    FetchAppMetadata(
      variables: FetchAppMetadataQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAppMetadataQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAppMetadataQuery>(
            FetchAppMetadataDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchAppMetadata",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
