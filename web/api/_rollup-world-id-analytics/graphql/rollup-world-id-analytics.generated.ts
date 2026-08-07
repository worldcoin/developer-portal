/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type RollupWorldIdAnalyticsMutationVariables = Types.Exact<{
  from_date?: Types.InputMaybe<Types.Scalars["date"]["input"]>;
  to_date?: Types.InputMaybe<Types.Scalars["date"]["input"]>;
}>;

export type RollupWorldIdAnalyticsMutation = {
  __typename?: "mutation_root";
  rollup_world_id_analytics: Array<{
    __typename?: "world_id_app_stats_daily";
    date_utc: string;
    unique_count: number;
  }>;
};

export const RollupWorldIdAnalyticsDocument = gql`
  mutation RollupWorldIdAnalytics($from_date: date, $to_date: date) {
    rollup_world_id_analytics(
      args: { from_date: $from_date, to_date: $to_date }
    ) {
      date_utc
      unique_count
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
