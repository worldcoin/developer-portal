/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type CheckAppInTeamQueryVariables = Types.Exact<{
  team_id: Types.Scalars["String"]["input"];
  app_id: Types.Scalars["String"]["input"];
}>;

export type CheckAppInTeamQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    id: string;
    app_metadata: Array<{ __typename?: "app_metadata"; id: string }>;
  }>;
};

export const CheckAppInTeamDocument = gql`
  query CheckAppInTeam($team_id: String!, $app_id: String!) {
    app(
      where: {
        id: { _eq: $app_id }
        team_id: { _eq: $team_id }
        deleted_at: { _is_null: true }
      }
      limit: 1
    ) {
      id
      app_metadata(
        where: { verification_status: { _eq: "unverified" } }
        limit: 1
      ) {
        id
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
    CheckAppInTeam(
      variables: CheckAppInTeamQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<CheckAppInTeamQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CheckAppInTeamQuery>(
            CheckAppInTeamDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "CheckAppInTeam",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
