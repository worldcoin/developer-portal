/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateRotationResultMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  signer_address: Types.Scalars["String"]["input"];
  operation_hash: Types.Scalars["String"]["input"];
}>;

export type UpdateRotationResultMutation = {
  __typename?: "mutation_root";
  update_rp_registration_by_pk?: {
    __typename?: "rp_registration";
    rp_id: string;
    app_id: string;
    status: unknown;
    signer_address: string;
    operation_hash?: string | null;
  } | null;
};

export const UpdateRotationResultDocument = gql`
  mutation UpdateRotationResult(
    $rp_id: String!
    $signer_address: String!
    $operation_hash: String!
  ) {
    update_rp_registration_by_pk(
      pk_columns: { rp_id: $rp_id }
      _set: { signer_address: $signer_address, operation_hash: $operation_hash }
    ) {
      rp_id
      app_id
      status
      signer_address
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
    UpdateRotationResult(
      variables: UpdateRotationResultMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateRotationResultMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateRotationResultMutation>(
            UpdateRotationResultDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "UpdateRotationResult",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
