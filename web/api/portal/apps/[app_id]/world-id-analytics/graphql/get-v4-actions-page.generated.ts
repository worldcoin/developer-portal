/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetWorldIdAnalyticsV4ActionsPageQueryVariables = Types.Exact<{
  where: Types.Action_V4_Bool_Exp;
  limit: Types.Scalars["Int"]["input"];
  offset: Types.Scalars["Int"]["input"];
}>;

export type GetWorldIdAnalyticsV4ActionsPageQuery = {
  __typename?: "query_root";
  action_v4: Array<{
    __typename?: "action_v4";
    id: string;
    action: string;
    description: string;
    created_at: string;
  }>;
  action_v4_aggregate: {
    __typename?: "action_v4_aggregate";
    aggregate?: {
      __typename?: "action_v4_aggregate_fields";
      count: number;
    } | null;
  };
};

export const GetWorldIdAnalyticsV4ActionsPageDocument = gql`
  query GetWorldIdAnalyticsV4ActionsPage(
    $where: action_v4_bool_exp!
    $limit: Int!
    $offset: Int!
  ) {
    action_v4(
      where: $where
      order_by: [{ created_at: desc }, { id: desc }]
      limit: $limit
      offset: $offset
    ) {
      id
      action
      description
      created_at
    }
    action_v4_aggregate(where: $where) {
      aggregate {
        count
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
    GetWorldIdAnalyticsV4ActionsPage(
      variables: GetWorldIdAnalyticsV4ActionsPageQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetWorldIdAnalyticsV4ActionsPageQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetWorldIdAnalyticsV4ActionsPageQuery>(
            GetWorldIdAnalyticsV4ActionsPageDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetWorldIdAnalyticsV4ActionsPage",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
