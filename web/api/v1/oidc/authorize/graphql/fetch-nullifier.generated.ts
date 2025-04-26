/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type NullifierQueryVariables = Types.Exact<{
  nullifier_hash: Types.Scalars["String"]["input"];
}>;

export type NullifierQuery = {
  __typename?: "query_root";
  nullifier: Array<{ __typename?: "nullifier"; id: string }>;
};

export const NullifierDocument = gql`
  query Nullifier($nullifier_hash: String!) {
    nullifier(where: { nullifier_hash: { _eq: $nullifier_hash } }) {
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
    Nullifier(
      variables: NullifierQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<NullifierQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<NullifierQuery>(NullifierDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "Nullifier",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
