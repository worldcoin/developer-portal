/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateSandboxRequestIosStatusMutationVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
  from_status: Types.Scalars["sandbox_access_request_ios_status"]["input"];
  status: Types.Scalars["sandbox_access_request_ios_status"]["input"];
  revoked_at?: Types.InputMaybe<Types.Scalars["timestamptz"]["input"]>;
  revoked_by?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type UpdateSandboxRequestIosStatusMutation = {
  __typename?: "mutation_root";
  update_sandbox_access_request_ios?: {
    __typename?: "sandbox_access_request_ios_mutation_response";
    affected_rows: number;
    returning: Array<{
      __typename?: "sandbox_access_request_ios";
      status: "pending" | "approved" | "rejected" | "revoked";
      updated_at: string;
      revoked_at?: string | null;
      revoked_by?: string | null;
    }>;
  } | null;
};

export const UpdateSandboxRequestIosStatusDocument = gql`
  mutation UpdateSandboxRequestIosStatus(
    $id: String!
    $from_status: sandbox_access_request_ios_status!
    $status: sandbox_access_request_ios_status!
    $revoked_at: timestamptz
    $revoked_by: String
  ) {
    update_sandbox_access_request_ios(
      where: { id: { _eq: $id }, status: { _eq: $from_status } }
      _set: {
        status: $status
        revoked_at: $revoked_at
        revoked_by: $revoked_by
      }
    ) {
      affected_rows
      returning {
        status
        updated_at
        revoked_at
        revoked_by
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
