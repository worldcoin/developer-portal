/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetWorldIdAnalyticsLegacyActionsPageQueryVariables = Types.Exact<{
  where: Types.Action_Bool_Exp;
  limit: Types.Scalars["Int"]["input"];
  offset: Types.Scalars["Int"]["input"];
}>;

export type GetWorldIdAnalyticsLegacyActionsPageQuery = {
  __typename?: "query_root";
  action: Array<{
    __typename?: "action";
    id: string;
    action: string;
    name: string;
    created_at: string;
  }>;
  action_aggregate: {
    __typename?: "action_aggregate";
    aggregate?: {
      __typename?: "action_aggregate_fields";
      count: number;
    } | null;
  };
};

export const GetWorldIdAnalyticsLegacyActionsPageDocument = gql`
  query GetWorldIdAnalyticsLegacyActionsPage(
    $where: action_bool_exp!
    $limit: Int!
    $offset: Int!
  ) {
    action(
      where: $where
      order_by: [{ created_at: desc }, { id: desc }]
      limit: $limit
      offset: $offset
    ) {
      id
      action
      name
      created_at
    }
    action_aggregate(where: $where) {
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
    GetWorldIdAnalyticsLegacyActionsPage(
      variables: GetWorldIdAnalyticsLegacyActionsPageQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetWorldIdAnalyticsLegacyActionsPageQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetWorldIdAnalyticsLegacyActionsPageQuery>(
            GetWorldIdAnalyticsLegacyActionsPageDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetWorldIdAnalyticsLegacyActionsPage",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
