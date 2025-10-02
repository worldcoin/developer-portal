/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchActionQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
  app_id: Types.Scalars["String"]["input"];
}>;

export type FetchActionQuery = {
  __typename?: "query_root";
  action: Array<{ __typename?: "action"; id: string; app_id: string }>;
};

export const FetchActionDocument = gql`
  query FetchAction($id: String!, $app_id: String!) {
    action(where: { id: { _eq: $id }, app_id: { _eq: $app_id } }) {
      id
      app_id
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
    FetchAction(
      variables: FetchActionQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchActionQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchActionQuery>(FetchActionDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "FetchAction",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
