/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type RollupV4AnalyticsMutationVariables = Types.Exact<{
  [key: string]: never;
}>;

export type RollupV4AnalyticsMutation = {
  __typename?: "mutation_root";
  rollup_v4_analytics: Array<{
    __typename?: "v4_analytics_state";
    key: string;
    timestamp_value: string;
  }>;
};

export const RollupV4AnalyticsDocument = gql`
  mutation RollupV4Analytics {
    rollup_v4_analytics {
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
    RollupV4Analytics(
      variables?: RollupV4AnalyticsMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<RollupV4AnalyticsMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<RollupV4AnalyticsMutation>(
            RollupV4AnalyticsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "RollupV4Analytics",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
