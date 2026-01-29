/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];

export type FetchActionV4QueryVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  action: Types.Scalars["String"]["input"];
}>;

export type FetchActionV4Query = {
  __typename?: "query_root";
  action_v4: Array<{
    __typename?: "action_v4";
    action: string;
    description: string;
    environment: string;
  }>;
};

export const FetchActionV4Document = gql`
  query FetchActionV4($rp_id: String!, $action: String!) {
    action_v4(where: { rp_id: { _eq: $rp_id }, action: { _eq: $action } }) {
      action
      description
      environment
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
    FetchActionV4(
      variables: FetchActionV4QueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchActionV4Query> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchActionV4Query>(
            FetchActionV4Document,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchActionV4",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
