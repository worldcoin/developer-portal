/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetWorldIdAnalyticsActionTotalQueryVariables = Types.Exact<{
  action_id: Types.Scalars["String"]["input"];
  source: Types.Scalars["String"]["input"];
}>;

export type GetWorldIdAnalyticsActionTotalQuery = {
  __typename?: "query_root";
  action_verification_stats_total_by_pk?: {
    __typename?: "action_verification_stats_total";
    verifications: number;
    unique_verifications: number;
    repeated_verifications: number;
    latest_verification_at?: string | null;
  } | null;
};

export const GetWorldIdAnalyticsActionTotalDocument = gql`
  query GetWorldIdAnalyticsActionTotal($action_id: String!, $source: String!) {
    action_verification_stats_total_by_pk(
      action_id: $action_id
      source: $source
      environment: "production"
    ) {
      verifications
      unique_verifications
      repeated_verifications
      latest_verification_at
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
    GetWorldIdAnalyticsActionTotal(
      variables: GetWorldIdAnalyticsActionTotalQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetWorldIdAnalyticsActionTotalQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetWorldIdAnalyticsActionTotalQuery>(
            GetWorldIdAnalyticsActionTotalDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetWorldIdAnalyticsActionTotal",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
