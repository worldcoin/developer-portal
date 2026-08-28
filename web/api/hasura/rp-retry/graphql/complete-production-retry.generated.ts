/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type CompleteProductionRetryMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  operation_hash: Types.Scalars["String"]["input"];
}>;

export type CompleteProductionRetryMutation = {
  __typename?: "mutation_root";
  update_rp_registration?: {
    __typename?: "rp_registration_mutation_response";
    affected_rows: number;
    returning: Array<{
      __typename?: "rp_registration";
      rp_id: string;
      status: unknown;
      operation_hash?: string | null;
    }>;
  } | null;
};

export const CompleteProductionRetryDocument = gql`
  mutation CompleteProductionRetry($rp_id: String!, $operation_hash: String!) {
    update_rp_registration(
      where: {
        rp_id: { _eq: $rp_id }
        status: { _eq: pending }
        review_configuration_change_kind: { _eq: "registration_retry" }
      }
      _set: { operation_hash: $operation_hash }
    ) {
      affected_rows
      returning {
        rp_id
        status
        operation_hash
      }
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
    CompleteProductionRetry(
      variables: CompleteProductionRetryMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<CompleteProductionRetryMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CompleteProductionRetryMutation>(
            CompleteProductionRetryDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "CompleteProductionRetry",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
