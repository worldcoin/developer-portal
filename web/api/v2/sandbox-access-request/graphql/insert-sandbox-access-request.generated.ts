/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type InsertSandboxAccessRequestMutationVariables = Types.Exact<{
  google_email: Types.Scalars["String"]["input"];
  user_id: Types.Scalars["String"]["input"];
}>;

export type InsertSandboxAccessRequestMutation = {
  __typename?: "mutation_root";
  insert_sandbox_access_request_one?: {
    __typename?: "sandbox_access_request";
    id: string;
    google_email: string;
    accepted: boolean;
    created_at: string;
  } | null;
};

export const InsertSandboxAccessRequestDocument = gql`
  mutation InsertSandboxAccessRequest(
    $google_email: String!
    $user_id: String!
  ) {
    insert_sandbox_access_request_one(
      object: { google_email: $google_email, user_id: $user_id }
      on_conflict: {
        constraint: unique_sandbox_access_request_user_id
        update_columns: []
      }
    ) {
      id
      google_email
      accepted
      created_at
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
    InsertSandboxAccessRequest(
      variables: InsertSandboxAccessRequestMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<InsertSandboxAccessRequestMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<InsertSandboxAccessRequestMutation>(
            InsertSandboxAccessRequestDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "InsertSandboxAccessRequest",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
