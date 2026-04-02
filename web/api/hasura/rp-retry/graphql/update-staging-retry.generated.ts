/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateStagingRetryMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  staging_operation_hash: Types.Scalars["String"]["input"];
  staging_status: Types.Scalars["rp_registration_status"]["input"];
}>;

export type UpdateStagingRetryMutation = {
  __typename?: "mutation_root";
  update_rp_registration_by_pk?: {
    __typename?: "rp_registration";
    rp_id: string;
    staging_status?: unknown | null;
    staging_operation_hash?: string | null;
  } | null;
};

export const UpdateStagingRetryDocument = gql`
  mutation UpdateStagingRetry(
    $rp_id: String!
    $staging_operation_hash: String!
    $staging_status: rp_registration_status!
  ) {
    update_rp_registration_by_pk(
      pk_columns: { rp_id: $rp_id }
      _set: {
        staging_operation_hash: $staging_operation_hash
        staging_status: $staging_status
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
    UpdateStagingRetry(
      variables: UpdateStagingRetryMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateStagingRetryMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateStagingRetryMutation>(
            UpdateStagingRetryDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "UpdateStagingRetry",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
