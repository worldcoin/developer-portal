/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type TransitionSandboxRequestIosStatusMutationVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
  from: Types.Scalars["sandbox_access_request_ios_status"]["input"];
  set: Types.Sandbox_Access_Request_Ios_Set_Input;
}>;

export type TransitionSandboxRequestIosStatusMutation = {
  __typename?: "mutation_root";
  update_sandbox_access_request_ios?: {
    __typename?: "sandbox_access_request_ios_mutation_response";
    affected_rows: number;
    returning: Array<{
      __typename?: "sandbox_access_request_ios";
      asc_email: string;
      status:
        | "pending"
        | "approving"
        | "approved"
        | "rejected"
        | "revoking"
        | "revoked";
    }>;
  } | null;
};

export const TransitionSandboxRequestIosStatusDocument = gql`
  mutation TransitionSandboxRequestIosStatus(
    $id: String!
    $from: sandbox_access_request_ios_status!
    $set: sandbox_access_request_ios_set_input!
  ) {
    update_sandbox_access_request_ios(
      where: { id: { _eq: $id }, status: { _eq: $from } }
      _set: $set
    ) {
      affected_rows
      returning {
        asc_email
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
    TransitionSandboxRequestIosStatus(
      variables: TransitionSandboxRequestIosStatusMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<TransitionSandboxRequestIosStatusMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<TransitionSandboxRequestIosStatusMutation>(
            TransitionSandboxRequestIosStatusDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "TransitionSandboxRequestIosStatus",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
