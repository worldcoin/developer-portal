/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type RollupAppStatsMutationVariables = Types.Exact<{
  since?: Types.InputMaybe<Types.Scalars["timestamptz"]["input"]>;
  until?: Types.InputMaybe<Types.Scalars["timestamptz"]["input"]>;
}>;

export type RollupAppStatsMutation = {
  __typename?: "mutation_root";
  rollup_app_stats: Array<{
    __typename?: "app_stats";
    app_id: string;
    date: string;
    verifications: number;
    unique_users: number;
  }>;
};

export const RollupAppStatsDocument = gql`
  mutation RollupAppStats($since: timestamptz, $until: timestamptz) {
    rollup_app_stats(args: { _since: $since, _until: $until }) {
      app_id
      date
      verifications
      unique_users
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
    RollupAppStats(
      variables?: RollupAppStatsMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<RollupAppStatsMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<RollupAppStatsMutation>(
            RollupAppStatsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "RollupAppStats",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
