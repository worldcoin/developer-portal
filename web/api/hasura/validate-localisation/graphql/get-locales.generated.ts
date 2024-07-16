/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type GetLocalesQueryVariables = Types.Exact<{
  id: Types.Scalars["String"];
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
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
