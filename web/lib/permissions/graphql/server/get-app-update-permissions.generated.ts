/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetIsUserPermittedToModifyAppQueryVariables = Types.Exact<{
  appId: Types.Scalars["String"]["input"];
  userId: Types.Scalars["String"]["input"];
}>;

export type GetIsUserPermittedToModifyAppQuery = {
  __typename?: "query_root";
  app_by_pk?: {
    __typename?: "app";
    team: {
      __typename?: "team";
      memberships: Array<{
        __typename?: "membership";
        user_id: string;
        role: Types.Role_Enum;
      }>;
    };
  } | null;
};

export const GetIsUserPermittedToModifyAppDocument = gql`
  query GetIsUserPermittedToModifyApp($appId: String!, $userId: String!) {
    app_by_pk(id: $appId) {
      team {
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
    GetIsUserPermittedToModifyApp(
      variables: GetIsUserPermittedToModifyAppQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetIsUserPermittedToModifyAppQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetIsUserPermittedToModifyAppQuery>(
            GetIsUserPermittedToModifyAppDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetIsUserPermittedToModifyApp",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
