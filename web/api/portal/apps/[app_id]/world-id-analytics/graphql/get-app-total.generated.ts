/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetWorldIdAnalyticsAppTotalQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  source: Types.Scalars["String"]["input"];
}>;

export type GetWorldIdAnalyticsAppTotalQuery = {
  __typename?: "query_root";
  app_verification_stats_total_by_pk?: {
    __typename?: "app_verification_stats_total";
    verifications: number;
    unique_verifications: number;
    repeated_verifications: number;
    latest_verification_at?: string | null;
  } | null;
};

export const GetWorldIdAnalyticsAppTotalDocument = gql`
  query GetWorldIdAnalyticsAppTotal($app_id: String!, $source: String!) {
    app_verification_stats_total_by_pk(
      app_id: $app_id
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
    GetWorldIdAnalyticsAppTotal(
      variables: GetWorldIdAnalyticsAppTotalQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetWorldIdAnalyticsAppTotalQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetWorldIdAnalyticsAppTotalQuery>(
            GetWorldIdAnalyticsAppTotalDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetWorldIdAnalyticsAppTotal",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
