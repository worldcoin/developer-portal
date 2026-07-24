/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetWorldIdAnalyticsRecentActivityQueryVariables = Types.Exact<{
  action_id: Types.Scalars["String"]["input"];
  limit: Types.Scalars["Int"]["input"];
}>;

export type GetWorldIdAnalyticsRecentActivityQuery = {
  __typename?: "query_root";
  nullifier_v4: Array<{
    __typename?: "nullifier_v4";
    nullifier: string;
    created_at: string;
    updated_at: string;
    uses: number;
  }>;
};

export const GetWorldIdAnalyticsRecentActivityDocument = gql`
  query GetWorldIdAnalyticsRecentActivity($action_id: String!, $limit: Int!) {
    nullifier_v4(
      where: { action_v4_id: { _eq: $action_id } }
      order_by: [{ updated_at: desc }, { id: desc }]
      limit: $limit
    ) {
      nullifier
      created_at
      updated_at
      uses
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
    GetWorldIdAnalyticsRecentActivity(
      variables: GetWorldIdAnalyticsRecentActivityQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetWorldIdAnalyticsRecentActivityQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetWorldIdAnalyticsRecentActivityQuery>(
            GetWorldIdAnalyticsRecentActivityDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetWorldIdAnalyticsRecentActivity",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
