/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetAppModeQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type GetAppModeQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    id: string;
    app_metadata: Array<{
      __typename?: "app_metadata";
      id: string;
      app_mode: string;
    }>;
    verified_app_metadata: Array<{
      __typename?: "app_metadata";
      id: string;
      app_mode: string;
    }>;
  }>;
};

export const GetAppModeDocument = gql`
  query GetAppMode($id: String!) {
    app(where: { id: { _eq: $id } }) {
      id
      app_metadata(where: { verification_status: { _neq: "verified" } }) {
        id
        app_mode
      }
      verified_app_metadata: app_metadata(
        where: { verification_status: { _eq: "verified" } }
      ) {
        id
        app_mode
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
    GetAppMode(
      variables: GetAppModeQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetAppModeQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetAppModeQuery>(GetAppModeDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "GetAppMode",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
