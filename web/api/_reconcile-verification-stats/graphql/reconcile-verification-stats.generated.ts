/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type ReconcileVerificationStatsMutationVariables = Types.Exact<{
  batch_size?: Types.InputMaybe<Types.Scalars["Int"]["input"]>;
}>;

export type ReconcileVerificationStatsMutation = {
  __typename?: "mutation_root";
  rr_reconcile_verification_stats: Array<{
    __typename?: "rr_verification_job_returning";
    job: string;
    status: string;
    items: number;
    repaired: number;
    alerts: number;
    detail?: string | null;
  }>;
};

export const ReconcileVerificationStatsDocument = gql`
  mutation ReconcileVerificationStats($batch_size: Int) {
    rr_reconcile_verification_stats(args: { _batch_size: $batch_size }) {
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
    ReconcileVerificationStats(
      variables?: ReconcileVerificationStatsMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<ReconcileVerificationStatsMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<ReconcileVerificationStatsMutation>(
            ReconcileVerificationStatsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "ReconcileVerificationStats",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
