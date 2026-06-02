/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateStagingRotationResultMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  staging_status: Types.Scalars["rp_registration_status"]["input"];
  staging_operation_hash?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type UpdateStagingRotationResultMutation = {
  __typename?: "mutation_root";
  update_rp_registration_by_pk?: {
    __typename?: "rp_registration";
    rp_id: string;
    staging_status?: unknown | null;
    staging_operation_hash?: string | null;
  } | null;
};

export const UpdateStagingRotationResultDocument = gql`
  mutation UpdateStagingRotationResult(
    $rp_id: String!
    $staging_status: rp_registration_status!
    $staging_operation_hash: String
  ) {
    update_rp_registration_by_pk(
      pk_columns: { rp_id: $rp_id }
      _set: {
        staging_status: $staging_status
        staging_operation_hash: $staging_operation_hash
      }
    ) {
      rp_id
      staging_status
      staging_operation_hash
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
    UpdateStagingRotationResult(
      variables: UpdateStagingRotationResultMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateStagingRotationResultMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateStagingRotationResultMutation>(
            UpdateStagingRotationResultDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "UpdateStagingRotationResult",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
