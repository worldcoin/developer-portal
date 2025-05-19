/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type DeleteExpiredAuthCodesMutationVariables = Types.Exact<{
  now: Types.Scalars["timestamptz"]["input"];
}>;

export type DeleteExpiredAuthCodesMutation = {
  __typename?: "mutation_root";
  delete_auth_code?: {
    __typename?: "auth_code_mutation_response";
    affected_rows: number;
  } | null;
};

export const DeleteExpiredAuthCodesDocument = gql`
  mutation DeleteExpiredAuthCodes($now: timestamptz!) {
    delete_auth_code(where: { expires_at: { _lte: $now } }) {
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
    DeleteExpiredAuthCodes(
      variables: DeleteExpiredAuthCodesMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<DeleteExpiredAuthCodesMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<DeleteExpiredAuthCodesMutation>(
            DeleteExpiredAuthCodesDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "DeleteExpiredAuthCodes",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
