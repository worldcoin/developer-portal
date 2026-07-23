/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type InsertSandboxAccessRequestMutationVariables = Types.Exact<{
  google_email: Types.Scalars["String"]["input"];
  requested_by: Types.Scalars["String"]["input"];
  team_id: Types.Scalars["String"]["input"];
}>;

export type InsertSandboxAccessRequestMutation = {
  __typename?: "mutation_root";
  insert_sandbox_access_request_one?: {
    __typename?: "sandbox_access_request";
    id: string;
    status: string;
  } | null;
};

export const InsertSandboxAccessRequestDocument = gql`
  mutation InsertSandboxAccessRequest(
    $google_email: String!
    $requested_by: String!
    $team_id: String!
  ) {
    insert_sandbox_access_request_one(
      object: {
        google_email: $google_email
        requested_by: $requested_by
        team_id: $team_id
        status: "pending"
        processed_at: null
      }
      on_conflict: {
        constraint: unique_sandbox_access_request_email_team
        update_columns: [status, processed_at, requested_by]
      }
    ) {
      id
      status
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
