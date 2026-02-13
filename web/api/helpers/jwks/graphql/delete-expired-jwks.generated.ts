/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type DeleteExpiredJwKsMutationVariables = Types.Exact<{
  expired_by?: Types.InputMaybe<Types.Scalars["timestamptz"]["input"]>;
}>;

export type DeleteExpiredJwKsMutation = {
  __typename?: "mutation_root";
  delete_jwks?: {
    __typename?: "jwks_mutation_response";
    returning: Array<{
      __typename?: "jwks";
      id: string;
      kms_id?: string | null;
    }>;
  } | null;
};

export const DeleteExpiredJwKsDocument = gql`
  mutation DeleteExpiredJWKs($expired_by: timestamptz = "") {
    delete_jwks(where: { expires_at: { _lte: $expired_by } }) {
      returning {
        id
        kms_id
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
    DeleteExpiredJWKs(
      variables?: DeleteExpiredJwKsMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<DeleteExpiredJwKsMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<DeleteExpiredJwKsMutation>(
            DeleteExpiredJwKsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "DeleteExpiredJWKs",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
