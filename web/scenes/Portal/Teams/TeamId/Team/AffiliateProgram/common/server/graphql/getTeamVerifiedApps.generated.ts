/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetTeamVerifiedAppsQueryVariables = Types.Exact<{
  teamId: Types.Scalars["String"]["input"];
}>;

export type GetTeamVerifiedAppsQuery = {
  __typename?: "query_root";
  app: Array<{ __typename?: "app"; id: string }>;
};

export const GetTeamVerifiedAppsDocument = gql`
  query GetTeamVerifiedApps($teamId: String!) {
    app(
      where: {
        team_id: { _eq: $teamId }
        is_banned: { _eq: false }
        verified_at: { _is_null: false }
      }
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
    GetTeamVerifiedApps(
      variables: GetTeamVerifiedAppsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetTeamVerifiedAppsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetTeamVerifiedAppsQuery>(
            GetTeamVerifiedAppsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetTeamVerifiedApps",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
