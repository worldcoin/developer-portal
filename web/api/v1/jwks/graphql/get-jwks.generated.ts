/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type JwkQueryQueryVariables = Types.Exact<{ [key: string]: never }>;

export type JwkQueryQuery = {
  __typename?: "query_root";
  jwks: Array<{
    __typename?: "jwks";
    id: string;
    expires_at: string;
    key: any;
  }>;
};

export const JwkQueryDocument = gql`
  query JWKQuery {
    jwks {
      id
      expires_at
      key: public_jwk
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
    JWKQuery(
      variables?: JwkQueryQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<JwkQueryQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<JwkQueryQuery>(JwkQueryDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "JWKQuery",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
