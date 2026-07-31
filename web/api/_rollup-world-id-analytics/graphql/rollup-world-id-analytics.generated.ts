/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type RollupWorldIdAnalyticsMutationVariables = Types.Exact<{
  [key: string]: never;
}>;

export type RollupWorldIdAnalyticsMutation = {
  __typename?: "mutation_root";
  rollup_world_id_analytics: Array<{
    __typename?: "world_id_analytics_state";
    processed_through: string;
  }>;
};

export const RollupWorldIdAnalyticsDocument = gql`
  mutation RollupWorldIdAnalytics {
    rollup_world_id_analytics {
      processed_through
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
    RollupWorldIdAnalytics(
      variables?: RollupWorldIdAnalyticsMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<RollupWorldIdAnalyticsMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<RollupWorldIdAnalyticsMutation>(
            RollupWorldIdAnalyticsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "RollupWorldIdAnalytics",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
