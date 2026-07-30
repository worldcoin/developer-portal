/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type ResolveInitialAppQueryVariables = Types.Exact<{
  teamId: Types.Scalars["String"]["input"];
  userId: Types.Scalars["String"]["input"];
  preferredAppId: Types.Scalars["String"]["input"];
}>;

export type ResolveInitialAppQuery = {
  __typename?: "query_root";
  preferredApp: Array<{ __typename?: "app"; id: string }>;
  fallbackApp: Array<{ __typename?: "app"; id: string }>;
};

export const ResolveInitialAppDocument = gql`
  query ResolveInitialApp(
    $teamId: String!
    $userId: String!
    $preferredAppId: String!
  ) {
    preferredApp: app(
      where: {
        id: { _eq: $preferredAppId }
        team_id: { _eq: $teamId }
        deleted_at: { _is_null: true }
        team: { memberships: { user_id: { _eq: $userId } } }
      }
      limit: 1
    ) {
      id
    }
    fallbackApp: app(
      where: {
        team_id: { _eq: $teamId }
        deleted_at: { _is_null: true }
        team: { memberships: { user_id: { _eq: $userId } } }
      }
      order_by: { created_at: asc }
      limit: 1
    ) {
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
    ResolveInitialApp(
      variables: ResolveInitialAppQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<ResolveInitialAppQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<ResolveInitialAppQuery>(
            ResolveInitialAppDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "ResolveInitialApp",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
