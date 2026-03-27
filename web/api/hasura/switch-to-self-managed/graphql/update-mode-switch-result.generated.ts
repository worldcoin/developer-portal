/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateModeSwitchResultMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  operation_hash: Types.Scalars["String"]["input"];
}>;

export type UpdateModeSwitchResultMutation = {
  __typename?: "mutation_root";
  update_rp_registration_by_pk?: {
    __typename?: "rp_registration";
    rp_id: string;
    app_id: string;
    mode: unknown;
    status: unknown;
    operation_hash?: string | null;
  } | null;
};

export const UpdateModeSwitchResultDocument = gql`
  mutation UpdateModeSwitchResult($rp_id: String!, $operation_hash: String!) {
    update_rp_registration_by_pk(
      pk_columns: { rp_id: $rp_id }
      _set: {
        mode: self_managed
        manager_kms_key_id: null
        signer_address: null
        operation_hash: $operation_hash
      }
    ) {
      rp_id
      app_id
      mode
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
    UpdateModeSwitchResult(
      variables: UpdateModeSwitchResultMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateModeSwitchResultMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateModeSwitchResultMutation>(
            UpdateModeSwitchResultDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "UpdateModeSwitchResult",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
