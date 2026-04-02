/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateStagingStatusMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  staging_status: Types.Scalars["rp_registration_status"]["input"];
}>;

export type UpdateStagingStatusMutation = {
  __typename?: "mutation_root";
  update_rp_registration_by_pk?: {
    __typename?: "rp_registration";
    rp_id: string;
    staging_status?: unknown | null;
    updated_at: string;
  } | null;
};

export const UpdateStagingStatusDocument = gql`
  mutation UpdateStagingStatus(
    $rp_id: String!
    $staging_status: rp_registration_status!
  ) {
    update_rp_registration_by_pk(
      pk_columns: { rp_id: $rp_id }
      _set: { staging_status: $staging_status }
    ) {
      rp_id
      staging_status
      updated_at
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
    UpdateStagingStatus(
      variables: UpdateStagingStatusMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateStagingStatusMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateStagingStatusMutation>(
            UpdateStagingStatusDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "UpdateStagingStatus",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
