/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetWorldIdAnalyticsV4ActionQueryVariables = Types.Exact<{
  action_id: Types.Scalars["String"]["input"];
}>;

export type GetWorldIdAnalyticsV4ActionQuery = {
  __typename?: "query_root";
  action_v4_by_pk?: {
    __typename?: "action_v4";
    environment: unknown;
    rp_registration: { __typename?: "rp_registration"; app_id: string };
  } | null;
};

export const GetWorldIdAnalyticsV4ActionDocument = gql`
  query GetWorldIdAnalyticsV4Action($action_id: String!) {
    action_v4_by_pk(id: $action_id) {
      environment
      rp_registration {
        app_id
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
    GetWorldIdAnalyticsV4Action(
      variables: GetWorldIdAnalyticsV4ActionQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetWorldIdAnalyticsV4ActionQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetWorldIdAnalyticsV4ActionQuery>(
            GetWorldIdAnalyticsV4ActionDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetWorldIdAnalyticsV4Action",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
