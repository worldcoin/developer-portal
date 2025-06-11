/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type IncrementAppStatsMutationVariables = Types.Exact<{
  nullifier_hash: Types.Scalars["String"]["input"];
  timestamp: Types.Scalars["timestamptz"]["input"];
  action_id: Types.Scalars["String"]["input"];
}>;

export type IncrementAppStatsMutation = {
  __typename?: "mutation_root";
  increment_app_stats: Array<{
    __typename?: "app_stats";
    app_id: string;
    date: string;
    verifications: number;
    unique_users: number;
  }>;
};

export const IncrementAppStatsDocument = gql`
  mutation IncrementAppStats(
    $nullifier_hash: String!
    $timestamp: timestamptz!
    $action_id: String!
  ) {
    increment_app_stats(
      args: {
        _nullifier_hash: $nullifier_hash
        _timestamp: $timestamp
        _action_id: $action_id
      }
    ) {
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
    IncrementAppStats(
      variables: IncrementAppStatsMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<IncrementAppStatsMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<IncrementAppStatsMutation>(
            IncrementAppStatsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "IncrementAppStats",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
