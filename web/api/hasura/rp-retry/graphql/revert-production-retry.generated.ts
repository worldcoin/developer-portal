/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type RevertProductionRetryMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
}>;

export type RevertProductionRetryMutation = {
  __typename?: "mutation_root";
  update_rp_registration?: {
    __typename?: "rp_registration_mutation_response";
    affected_rows: number;
  } | null;
};

export const RevertProductionRetryDocument = gql`
  mutation RevertProductionRetry($rp_id: String!) {
    update_rp_registration(
      where: {
        rp_id: { _eq: $rp_id }
        status: { _eq: pending }
        review_configuration_change_kind: { _eq: "registration_retry" }
      }
      _set: { status: failed }
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
    RevertProductionRetry(
      variables: RevertProductionRetryMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<RevertProductionRetryMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<RevertProductionRetryMutation>(
            RevertProductionRetryDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "RevertProductionRetry",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
