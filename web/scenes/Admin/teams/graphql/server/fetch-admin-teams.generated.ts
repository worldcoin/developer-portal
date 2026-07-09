/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchAdminTeamsQueryVariables = Types.Exact<{
  [key: string]: never;
}>;

export type FetchAdminTeamsQuery = {
  __typename?: "query_root";
  team: Array<{
    __typename?: "team";
    id: string;
    name?: string | null;
    created_at: string;
    deleted_at?: string | null;
  }>;
  membership: Array<{ __typename?: "membership"; team_id: string }>;
  app: Array<{ __typename?: "app"; team_id: string }>;
  api_key: Array<{ __typename?: "api_key"; team_id: string }>;
  invite: Array<{ __typename?: "invite"; team_id: string }>;
};

export const FetchAdminTeamsDocument = gql`
  query FetchAdminTeams {
    team(order_by: { created_at: desc }) {
      id
      name
      created_at
      deleted_at
    }
    membership {
      team_id
    }
    app(where: { deleted_at: { _is_null: true } }) {
      team_id
    }
    api_key(where: { is_active: { _eq: true } }) {
      team_id
    }
    invite(where: { expires_at: { _gte: "now()" } }) {
      team_id
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
    FetchAdminTeams(
      variables?: FetchAdminTeamsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAdminTeamsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAdminTeamsQuery>(
            FetchAdminTeamsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchAdminTeams",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
