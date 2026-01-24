/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetAppInfoQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
}>;

export type GetAppInfoQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    id: string;
    team_id: string;
    app_metadata: Array<{ __typename?: "app_metadata"; name: string }>;
  }>;
};

export const GetAppInfoDocument = gql`
  query GetAppInfo($app_id: String!) {
    app(where: { id: { _eq: $app_id } }) {
      id
      team_id
      app_metadata(limit: 1, order_by: { created_at: desc }) {
        name
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
    GetAppInfo(
      variables: GetAppInfoQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetAppInfoQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetAppInfoQuery>(GetAppInfoDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "GetAppInfo",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
