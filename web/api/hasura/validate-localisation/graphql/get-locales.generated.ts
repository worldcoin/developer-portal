/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetLocalesQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type GetLocalesQuery = {
  __typename?: "query_root";
  app_metadata_by_pk?: {
    __typename?: "app_metadata";
    supported_languages?: Array<string> | null;
  } | null;
};

export const GetLocalesDocument = gql`
  query GetLocales($id: String!) {
    app_metadata_by_pk(id: $id) {
      supported_languages
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
    GetLocales(
      variables: GetLocalesQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetLocalesQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetLocalesQuery>(GetLocalesDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "GetLocales",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
