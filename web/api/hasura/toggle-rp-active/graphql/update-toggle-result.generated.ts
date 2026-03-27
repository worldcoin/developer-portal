/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateToggleResultMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  operation_hash: Types.Scalars["String"]["input"];
}>;

export type UpdateToggleResultMutation = {
  __typename?: "mutation_root";
  update_rp_registration_by_pk?: {
    __typename?: "rp_registration";
    rp_id: string;
    app_id: string;
    status: unknown;
    operation_hash?: string | null;
  } | null;
};

export const UpdateToggleResultDocument = gql`
  mutation UpdateToggleResult($rp_id: String!, $operation_hash: String!) {
    update_rp_registration_by_pk(
      pk_columns: { rp_id: $rp_id }
      _set: { operation_hash: $operation_hash }
    ) {
      rp_id
      app_id
      status
      operation_hash
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
    UpdateToggleResult(
      variables: UpdateToggleResultMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateToggleResultMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateToggleResultMutation>(
            UpdateToggleResultDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "UpdateToggleResult",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
