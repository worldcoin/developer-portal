/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type FetchUserByNullifierQueryVariables = Types.Exact<{
  world_id_nullifier: Types.Scalars["String"];
}>;

export type FetchUserByNullifierQuery = {
  __typename?: "query_root";
  user: Array<{
    __typename?: "user";
    id: string;
    auth0Id?: string | null;
    team_id: string;
    name: string;
  }>;
};

export const FetchUserByNullifierDocument = gql`
  query FetchUserByNullifier($world_id_nullifier: String!) {
    user(where: { world_id_nullifier: { _eq: $world_id_nullifier } }) {
      id
      auth0Id
      team_id
      name
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
    FetchUserByNullifier(
      variables: FetchUserByNullifierQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders
    ): Promise<FetchUserByNullifierQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchUserByNullifierQuery>(
            FetchUserByNullifierDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders }
          ),
        "FetchUserByNullifier",
        "query"
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
