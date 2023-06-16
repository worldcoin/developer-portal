/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import * as Dom from "graphql-request/dist/types.dom";
import gql from "graphql-tag";
export type FindUserByNullifierQueryVariables = Types.Exact<{
  nullifier: Types.Scalars["String"];
}>;

export type FindUserByNullifierQuery = {
  __typename?: "query_root";
  users: Array<{ __typename?: "user"; id: string; team_id: string }>;
};

export const FindUserByNullifierDocument = gql`
  query FindUserByNullifier($nullifier: String!) {
    users: user(where: { world_id_nullifier: { _eq: $nullifier } }) {
      id
      team_id
    }
  }
`;

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType
) => action();

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper
) {
  return {
    FindUserByNullifier(
      variables: FindUserByNullifierQueryVariables,
      requestHeaders?: Dom.RequestInit["headers"]
    ): Promise<FindUserByNullifierQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FindUserByNullifierQuery>(
            FindUserByNullifierDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders }
          ),
        "FindUserByNullifier",
        "query"
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
