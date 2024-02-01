/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type RetrieveJwkQueryVariables = Types.Exact<{
  kid: Types.Scalars["String"];
}>;

export type RetrieveJwkQuery = {
  __typename?: "query_root";
  jwks: Array<{
    __typename?: "jwks";
    id: string;
    kms_id?: string | null;
    public_jwk: any;
  }>;
};

export const RetrieveJwkDocument = gql`
  query RetrieveJWK($kid: String!) {
    jwks(limit: 1, where: { id: { _eq: $kid } }) {
      id
      kms_id
      public_jwk
    }
  }
`;

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType,
) => action();

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper,
) {
  return {
    RetrieveJWK(
      variables: RetrieveJwkQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<RetrieveJwkQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<RetrieveJwkQuery>(RetrieveJwkDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "RetrieveJWK",
        "query",
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
