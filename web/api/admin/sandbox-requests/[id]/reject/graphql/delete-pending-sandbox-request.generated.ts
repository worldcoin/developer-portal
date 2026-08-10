/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetPendingSandboxRequestQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type GetPendingSandboxRequestQuery = {
  __typename?: "query_root";
  sandbox_access_request: Array<{
    __typename?: "sandbox_access_request";
    google_email: string;
    user: { __typename?: "user"; name: string; email?: string | null };
  }>;
};

export type DeletePendingSandboxRequestMutationVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type DeletePendingSandboxRequestMutation = {
  __typename?: "mutation_root";
  delete_sandbox_access_request?: {
    __typename?: "sandbox_access_request_mutation_response";
    affected_rows: number;
  } | null;
};

export const GetPendingSandboxRequestDocument = gql`
  query GetPendingSandboxRequest($id: String!) {
    sandbox_access_request(
      where: { id: { _eq: $id }, accepted: { _eq: false } }
      limit: 1
    ) {
      google_email
      user {
        name
        email
      }
    }
  }
`;
export const DeletePendingSandboxRequestDocument = gql`
  mutation DeletePendingSandboxRequest($id: String!) {
    delete_sandbox_access_request(
      where: { id: { _eq: $id }, accepted: { _eq: false } }
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
    GetPendingSandboxRequest(
      variables: GetPendingSandboxRequestQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetPendingSandboxRequestQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetPendingSandboxRequestQuery>(
            GetPendingSandboxRequestDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetPendingSandboxRequest",
        "query",
        variables,
      );
    },
    DeletePendingSandboxRequest(
      variables: DeletePendingSandboxRequestMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<DeletePendingSandboxRequestMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<DeletePendingSandboxRequestMutation>(
            DeletePendingSandboxRequestDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "DeletePendingSandboxRequest",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
