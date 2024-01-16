/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type AppsByUserAndTeamQueryVariables = Types.Exact<{
  user_id: Types.Scalars["String"];
  team_id: Types.Scalars["String"];
}>;

export type AppsByUserAndTeamQuery = {
  __typename?: "query_root";
  app: Array<{ __typename?: "app"; id: string }>;
};

export const AppsByUserAndTeamDocument = gql`
  query AppsByUserAndTeam($user_id: String!, $team_id: String!) {
    app(
      where: {
        team: {
          memberships: {
            _and: { team_id: { _eq: $team_id }, user_id: { _eq: $user_id } }
          }
        }
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
    AppsByUserAndTeam(
      variables: AppsByUserAndTeamQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders
    ): Promise<AppsByUserAndTeamQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<AppsByUserAndTeamQuery>(
            AppsByUserAndTeamDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders }
          ),
        "AppsByUserAndTeam",
        "query"
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
