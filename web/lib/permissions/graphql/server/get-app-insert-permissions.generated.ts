/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetIsUserPermittedToInsertAppQueryVariables = Types.Exact<{
  userId: Types.Scalars["String"]["input"];
  teamId: Types.Scalars["String"]["input"];
}>;

export type GetIsUserPermittedToInsertAppQuery = {
  __typename?: "query_root";
  team: Array<{
    __typename?: "team";
    id: string;
    memberships: Array<{
      __typename?: "membership";
      user_id: string;
      role: Types.Role_Enum;
    }>;
  }>;
};

export const GetIsUserPermittedToInsertAppDocument = gql`
  query GetIsUserPermittedToInsertApp($userId: String!, $teamId: String!) {
    team(where: { id: { _eq: $teamId }, deleted_at: { _is_null: true } }) {
      id
      memberships(
        where: {
          _or: [
            { user_id: { _eq: $userId }, role: { _eq: OWNER } }
            { user_id: { _eq: $userId }, role: { _eq: ADMIN } }
          ]
        }
      ) {
        user_id
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
    GetIsUserPermittedToInsertApp(
      variables: GetIsUserPermittedToInsertAppQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetIsUserPermittedToInsertAppQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetIsUserPermittedToInsertAppQuery>(
            GetIsUserPermittedToInsertAppDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetIsUserPermittedToInsertApp",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
