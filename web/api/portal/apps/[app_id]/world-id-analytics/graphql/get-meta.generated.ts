/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetWorldIdAnalyticsMetaQueryVariables = Types.Exact<{
  [key: string]: never;
}>;

export type GetWorldIdAnalyticsMetaQuery = {
  __typename?: "query_root";
  verification_analytics_meta: Array<{
    __typename?: "verification_meta_returning";
    key: string;
    timestamp_value?: string | null;
  }>;
};

export const GetWorldIdAnalyticsMetaDocument = gql`
  query GetWorldIdAnalyticsMeta {
    verification_analytics_meta {
      key
      timestamp_value
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
    GetWorldIdAnalyticsMeta(
      variables?: GetWorldIdAnalyticsMetaQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetWorldIdAnalyticsMetaQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetWorldIdAnalyticsMetaQuery>(
            GetWorldIdAnalyticsMetaDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetWorldIdAnalyticsMeta",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
