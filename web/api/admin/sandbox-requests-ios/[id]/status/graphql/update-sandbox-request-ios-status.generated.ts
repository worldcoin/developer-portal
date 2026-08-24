/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateSandboxRequestIosStatusMutationVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
  from_status: Types.Scalars["sandbox_access_request_ios_status"]["input"];
  set: Types.Sandbox_Access_Request_Ios_Set_Input;
}>;

export type UpdateSandboxRequestIosStatusMutation = {
  __typename?: "mutation_root";
  update_sandbox_access_request_ios?: {
    __typename?: "sandbox_access_request_ios_mutation_response";
    affected_rows: number;
    returning: Array<{
      __typename?: "sandbox_access_request_ios";
      status: "pending" | "approved" | "rejected" | "revoking" | "revoked";
    }>;
  } | null;
};

export const UpdateSandboxRequestIosStatusDocument = gql`
  mutation UpdateSandboxRequestIosStatus(
    $id: String!
    $from_status: sandbox_access_request_ios_status!
    $set: sandbox_access_request_ios_set_input!
  ) {
    update_sandbox_access_request_ios(
      where: { id: { _eq: $id }, status: { _eq: $from_status } }
      _set: $set
    ) {
      affected_rows
      returning {
        status
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
    UpdateSandboxRequestIosStatus(
      variables: UpdateSandboxRequestIosStatusMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateSandboxRequestIosStatusMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateSandboxRequestIosStatusMutation>(
            UpdateSandboxRequestIosStatusDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "UpdateSandboxRequestIosStatus",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
