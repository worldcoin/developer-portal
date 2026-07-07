/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetIsUserPermittedToUpdateActionQueryVariables = Types.Exact<{
  userId: Types.Scalars["String"]["input"];
  teamId: Types.Scalars["String"]["input"];
  actionId: Types.Scalars["String"]["input"];
}>;

export type GetIsUserPermittedToUpdateActionQuery = {
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

export const GetIsUserPermittedToUpdateActionDocument = gql`
  query GetIsUserPermittedToUpdateAction(
    $userId: String!
    $teamId: String!
    $actionId: String!
  ) {
    team(
      where: {
        id: { _eq: $teamId }
        apps: { actions: { id: { _eq: $actionId } } }
      }
    ) {
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
    GetIsUserPermittedToUpdateAction(
      variables: GetIsUserPermittedToUpdateActionQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetIsUserPermittedToUpdateActionQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetIsUserPermittedToUpdateActionQuery>(
            GetIsUserPermittedToUpdateActionDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetIsUserPermittedToUpdateAction",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
