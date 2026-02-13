/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type InsertJwkMutationVariables = Types.Exact<{
  expires_at: Types.Scalars["timestamptz"]["input"];
  public_jwk: Types.Scalars["jsonb"]["input"];
  kms_id: Types.Scalars["String"]["input"];
}>;

export type InsertJwkMutation = {
  __typename?: "mutation_root";
  insert_jwks_one?: {
    __typename?: "jwks";
    id: string;
    kms_id?: string | null;
    expires_at: string;
  } | null;
};

export const InsertJwkDocument = gql`
  mutation InsertJWK(
    $expires_at: timestamptz!
    $public_jwk: jsonb!
    $kms_id: String!
  ) {
    insert_jwks_one(
      object: {
        expires_at: $expires_at
        kms_id: $kms_id
        public_jwk: $public_jwk
      }
    ) {
      id
      kms_id
      expires_at
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
    InsertJWK(
      variables: InsertJwkMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<InsertJwkMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<InsertJwkMutation>(InsertJwkDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "InsertJWK",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
