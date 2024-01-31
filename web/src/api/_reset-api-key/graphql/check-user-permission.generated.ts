/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type CheckUserPermissionQueryVariables = Types.Exact<{
  id: Types.Scalars["String"];
  team_id: Types.Scalars["String"];
  user_id: Types.Scalars["String"];
}>;

export type CheckUserPermissionQuery = {
  __typename?: "query_root";
  team: Array<{ __typename?: "team"; id: string }>;
};

export const CheckUserPermissionDocument = gql`
  query CheckUserPermission(
    $id: String!
    $team_id: String!
    $user_id: String!
  ) {
    team(
      where: {
        id: { _eq: $team_id }
        memberships: { user_id: { _eq: $user_id }, role: { _eq: OWNER } }
        api_keys: { id: { _eq: $id } }
      }
    ) {
      id
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
    CheckUserPermission(
      variables: CheckUserPermissionQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders
    ): Promise<CheckUserPermissionQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CheckUserPermissionQuery>(
            CheckUserPermissionDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders }
          ),
        "CheckUserPermission",
        "query"
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
