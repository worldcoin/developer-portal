/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type ReconcileProductionRetryMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
}>;

export type ReconcileProductionRetryMutation = {
  __typename?: "mutation_root";
  update_rp_registration?: {
    __typename?: "rp_registration_mutation_response";
    affected_rows: number;
  } | null;
};

export const ReconcileProductionRetryDocument = gql`
  mutation ReconcileProductionRetry($rp_id: String!) {
    update_rp_registration(
      where: {
        rp_id: { _eq: $rp_id }
        status: { _eq: failed }
        review_configuration_change_kind: { _is_null: true }
      }
      _set: { status: registered }
    ) {
      affected_rows
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
    ReconcileProductionRetry(
      variables: ReconcileProductionRetryMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<ReconcileProductionRetryMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<ReconcileProductionRetryMutation>(
            ReconcileProductionRetryDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "ReconcileProductionRetry",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
