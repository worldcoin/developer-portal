/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type InsertSandboxAccessRequestIosMutationVariables = Types.Exact<{
  asc_email: Types.Scalars["String"]["input"];
  portal_email: Types.Scalars["String"]["input"];
  team_id: Types.Scalars["String"]["input"];
  user_id: Types.Scalars["String"]["input"];
}>;

export type InsertSandboxAccessRequestIosMutation = {
  __typename?: "mutation_root";
  insert_sandbox_access_request_ios_one?: {
    __typename?: "sandbox_access_request_ios";
    id: string;
  } | null;
};

export const InsertSandboxAccessRequestIosDocument = gql`
  mutation InsertSandboxAccessRequestIos(
    $asc_email: String!
    $portal_email: String!
    $team_id: String!
    $user_id: String!
  ) {
    insert_sandbox_access_request_ios_one(
      object: {
        asc_email: $asc_email
        portal_email: $portal_email
        team_id: $team_id
        user_id: $user_id
      }
    ) {
      id
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
    InsertSandboxAccessRequestIos(
      variables: InsertSandboxAccessRequestIosMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<InsertSandboxAccessRequestIosMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<InsertSandboxAccessRequestIosMutation>(
            InsertSandboxAccessRequestIosDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "InsertSandboxAccessRequestIos",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
