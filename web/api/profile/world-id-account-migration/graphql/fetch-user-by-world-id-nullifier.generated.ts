/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchUserByWorldIdNullifierQueryVariables = Types.Exact<{
  world_id_nullifiers:
    | Array<Types.Scalars["String"]["input"]>
    | Types.Scalars["String"]["input"];
  current_user_id: Types.Scalars["String"]["input"];
}>;

export type FetchUserByWorldIdNullifierQuery = {
  __typename?: "query_root";
  user: Array<{
    __typename?: "user";
    id: string;
    email?: string | null;
    name: string;
    auth0Id?: string | null;
    world_id_nullifier?: string | null;
    memberships: Array<{
      __typename?: "membership";
      id: string;
      team_id: string;
      role: Types.Role_Enum;
    }>;
  }>;
  current_user?: {
    __typename?: "user";
    id: string;
    world_id_nullifier?: string | null;
    memberships: Array<{
      __typename?: "membership";
      id: string;
      team_id: string;
      role: Types.Role_Enum;
    }>;
  } | null;
};

export const FetchUserByWorldIdNullifierDocument = gql`
  query FetchUserByWorldIdNullifier(
    $world_id_nullifiers: [String!]!
    $current_user_id: String!
  ) {
    user(
      where: { world_id_nullifier: { _in: $world_id_nullifiers } }
      limit: 3
    ) {
      id
      email
      name
      auth0Id
      world_id_nullifier
      memberships {
        id
        team_id
        role
      }
    }
    current_user: user_by_pk(id: $current_user_id) {
      id
      world_id_nullifier
      memberships {
        id
        team_id
        role
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
    FetchUserByWorldIdNullifier(
      variables: FetchUserByWorldIdNullifierQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchUserByWorldIdNullifierQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchUserByWorldIdNullifierQuery>(
            FetchUserByWorldIdNullifierDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchUserByWorldIdNullifier",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
