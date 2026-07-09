/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchAdminTeamsQueryVariables = Types.Exact<{
  includeActiveApiKeysCount: Types.Scalars["Boolean"]["input"];
  includeAppsCount: Types.Scalars["Boolean"]["input"];
  includeCreatedAt: Types.Scalars["Boolean"]["input"];
  includeMembersCount: Types.Scalars["Boolean"]["input"];
  includePendingInvitesCount: Types.Scalars["Boolean"]["input"];
  includeStatus: Types.Scalars["Boolean"]["input"];
  limit: Types.Scalars["Int"]["input"];
  offset: Types.Scalars["Int"]["input"];
  where: Types.Team_Bool_Exp;
}>;

export type FetchAdminTeamsQuery = {
  __typename?: "query_root";
  team: Array<{
    __typename?: "team";
    id: string;
    name?: string | null;
    created_at?: string;
    deleted_at?: string | null;
  }>;
  team_aggregate: {
    __typename?: "team_aggregate";
    aggregate?: {
      __typename?: "team_aggregate_fields";
      count: number;
    } | null;
  };
  membership?: Array<{ __typename?: "membership"; team_id: string }>;
  app?: Array<{ __typename?: "app"; team_id: string }>;
  api_key?: Array<{ __typename?: "api_key"; team_id: string }>;
  invite?: Array<{ __typename?: "invite"; team_id: string }>;
};

export const FetchAdminTeamsDocument = gql`
  query FetchAdminTeams(
    $includeActiveApiKeysCount: Boolean!
    $includeAppsCount: Boolean!
    $includeCreatedAt: Boolean!
    $includeMembersCount: Boolean!
    $includePendingInvitesCount: Boolean!
    $includeStatus: Boolean!
    $limit: Int!
    $offset: Int!
    $where: team_bool_exp!
  ) {
    team(
      limit: $limit
      offset: $offset
      order_by: { created_at: desc }
      where: $where
    ) {
      id
      name
      created_at @include(if: $includeCreatedAt)
      deleted_at @include(if: $includeStatus)
    }
    team_aggregate(where: $where) {
      aggregate {
        count
      }
    }
    membership @include(if: $includeMembersCount) {
      team_id
    }
    app(where: { deleted_at: { _is_null: true } })
      @include(if: $includeAppsCount) {
      team_id
    }
    api_key(where: { is_active: { _eq: true } })
      @include(if: $includeActiveApiKeysCount) {
      team_id
    }
    invite(where: { expires_at: { _gte: "now()" } })
      @include(if: $includePendingInvitesCount) {
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
