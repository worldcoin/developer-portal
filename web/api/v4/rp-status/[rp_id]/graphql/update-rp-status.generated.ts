/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateRpStatusMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  status: Types.Scalars["rp_registration_status"]["input"];
}>;

export type UpdateRpStatusMutation = {
  __typename?: "mutation_root";
  update_rp_registration_by_pk?: {
    __typename?: "rp_registration";
    rp_id: string;
    status: unknown;
    updated_at: string;
  } | null;
};

export const UpdateRpStatusDocument = gql`
  mutation UpdateRpStatus($rp_id: String!, $status: rp_registration_status!) {
    update_rp_registration_by_pk(
      pk_columns: { rp_id: $rp_id }
      _set: { status: $status }
    ) {
      rp_id
      status
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
    UpdateRpStatus(
      variables: UpdateRpStatusMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateRpStatusMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateRpStatusMutation>(
            UpdateRpStatusDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "UpdateRpStatus",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
