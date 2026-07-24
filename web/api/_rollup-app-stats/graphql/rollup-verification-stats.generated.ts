/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type RollupVerificationStatsMutationVariables = Types.Exact<{
  [key: string]: never;
}>;

export type RollupVerificationStatsMutation = {
  __typename?: "mutation_root";
  rollup_verification_stats: Array<{
    __typename?: "verification_job_returning";
    job: string;
    status: string;
    items: number;
    repaired: number;
    alerts: number;
    detail?: string | null;
  }>;
};

export const RollupVerificationStatsDocument = gql`
  mutation RollupVerificationStats {
    rollup_verification_stats(args: {}) {
      job
      status
      items
      repaired
      alerts
      detail
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
    RollupVerificationStats(
      variables?: RollupVerificationStatsMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<RollupVerificationStatsMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<RollupVerificationStatsMutation>(
            RollupVerificationStatsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "RollupVerificationStats",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
