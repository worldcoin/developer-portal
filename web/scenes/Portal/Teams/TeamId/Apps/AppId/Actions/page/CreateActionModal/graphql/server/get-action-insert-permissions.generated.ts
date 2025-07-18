/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetIsUserPermittedToInsertActionQueryVariables = Types.Exact<{
  userId: Types.Scalars["String"]["input"];
  teamId: Types.Scalars["String"]["input"];
  appId: Types.Scalars["String"]["input"];
}>;

export type GetIsUserPermittedToInsertActionQuery = {
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

export const GetIsUserPermittedToInsertActionDocument = gql`
  query GetIsUserPermittedToInsertAction(
    $userId: String!
    $teamId: String!
    $appId: String!
  ) {
    team(where: { id: { _eq: $teamId }, apps: { id: { _eq: $appId } } }) {
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
    GetIsUserPermittedToInsertAction(
      variables: GetIsUserPermittedToInsertActionQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetIsUserPermittedToInsertActionQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetIsUserPermittedToInsertActionQuery>(
            GetIsUserPermittedToInsertActionDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetIsUserPermittedToInsertAction",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
