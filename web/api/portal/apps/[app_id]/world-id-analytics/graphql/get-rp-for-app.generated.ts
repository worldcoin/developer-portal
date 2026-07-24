/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetWorldIdAnalyticsRpForAppQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
}>;

export type GetWorldIdAnalyticsRpForAppQuery = {
  __typename?: "query_root";
  rp_registration: Array<{ __typename?: "rp_registration"; rp_id: string }>;
};

export const GetWorldIdAnalyticsRpForAppDocument = gql`
  query GetWorldIdAnalyticsRpForApp($app_id: String!) {
    rp_registration(where: { app_id: { _eq: $app_id } }, limit: 1) {
      rp_id
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
    GetWorldIdAnalyticsRpForApp(
      variables: GetWorldIdAnalyticsRpForAppQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetWorldIdAnalyticsRpForAppQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetWorldIdAnalyticsRpForAppQuery>(
            GetWorldIdAnalyticsRpForAppDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetWorldIdAnalyticsRpForApp",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
