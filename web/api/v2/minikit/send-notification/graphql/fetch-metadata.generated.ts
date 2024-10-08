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
  app_metadata: Array<{
    __typename?: "app_metadata";
    name: string;
    app_id: string;
    is_reviewer_app_store_approved: boolean;
    app: { __typename?: "app"; team: { __typename?: "team"; id: string } };
  }>;
};

export const GetAppMetadataDocument = gql`
  query GetAppMetadata($app_id: String!) {
    app_metadata(
      where: {
        app_id: { _eq: $app_id }
        verification_status: { _eq: "verified" }
        app: { is_banned: { _eq: false } }
      }
    ) {
      name
      app_id
      is_reviewer_app_store_approved
      app {
        team {
          id
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
