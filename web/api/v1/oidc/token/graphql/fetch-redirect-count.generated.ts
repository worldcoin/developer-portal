/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchRedirectCountQueryQueryVariables = Types.Exact<{
  app_id?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type FetchRedirectCountQueryQuery = {
  __typename?: "query_root";
  action: Array<{ __typename?: "action"; redirect_count?: number | null }>;
};

export const FetchRedirectCountQueryDocument = gql`
  query FetchRedirectCountQuery($app_id: String) {
    action(where: { app_id: { _eq: $app_id }, action: { _eq: "" } }) {
      redirect_count
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
    FetchRedirectCountQuery(
      variables?: FetchRedirectCountQueryQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchRedirectCountQueryQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchRedirectCountQueryQuery>(
            FetchRedirectCountQueryDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchRedirectCountQuery",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
