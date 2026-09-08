/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetIsUserPermittedToSwitchRpModeQueryVariables = Types.Exact<{
  appId: Types.Scalars["String"]["input"];
  userId: Types.Scalars["String"]["input"];
}>;

export type GetIsUserPermittedToSwitchRpModeQuery = {
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

export const GetIsUserPermittedToSwitchRpModeDocument = gql`
  query GetIsUserPermittedToSwitchRpMode($appId: String!, $userId: String!) {
    app_by_pk(id: $appId) {
      team {
        memberships(
          where: {
            _and: [{ user_id: { _eq: $userId } }, { role: { _eq: OWNER } }]
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
    GetIsUserPermittedToSwitchRpMode(
      variables: GetIsUserPermittedToSwitchRpModeQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetIsUserPermittedToSwitchRpModeQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetIsUserPermittedToSwitchRpModeQuery>(
            GetIsUserPermittedToSwitchRpModeDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetIsUserPermittedToSwitchRpMode",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
