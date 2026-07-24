/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type MarkSandboxInviteSentMutationVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
  processed_at: Types.Scalars["timestamptz"]["input"];
}>;

export type MarkSandboxInviteSentMutation = {
  __typename?: "mutation_root";
  update_sandbox_access_request?: {
    __typename?: "sandbox_access_request_mutation_response";
    affected_rows: number;
  } | null;
};

export const MarkSandboxInviteSentDocument = gql`
  mutation MarkSandboxInviteSent($id: String!, $processed_at: timestamptz!) {
    update_sandbox_access_request(
      where: { id: { _eq: $id }, accepted: { _eq: false } }
      _set: { accepted: true, processed_at: $processed_at }
    ) {
      affected_rows
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
    MarkSandboxInviteSent(
      variables: MarkSandboxInviteSentMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<MarkSandboxInviteSentMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<MarkSandboxInviteSentMutation>(
            MarkSandboxInviteSentDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "MarkSandboxInviteSent",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
