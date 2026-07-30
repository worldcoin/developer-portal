/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type InsertSessionVerificationV4MutationVariables = Types.Exact<{
  object: Types.Session_Verification_V4_Insert_Input;
}>;

export type InsertSessionVerificationV4Mutation = {
  __typename?: "mutation_root";
  insert_session_verification_v4?: {
    __typename?: "session_verification_v4_mutation_response";
    affected_rows: number;
  } | null;
};

export const InsertSessionVerificationV4Document = gql`
  mutation InsertSessionVerificationV4(
    $object: session_verification_v4_insert_input!
  ) {
    insert_session_verification_v4(objects: [$object]) {
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
    InsertSessionVerificationV4(
      variables: InsertSessionVerificationV4MutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<InsertSessionVerificationV4Mutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<InsertSessionVerificationV4Mutation>(
            InsertSessionVerificationV4Document,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "InsertSessionVerificationV4",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
