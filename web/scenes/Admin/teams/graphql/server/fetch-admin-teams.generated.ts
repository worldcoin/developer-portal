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
  includeStatus: Types.Scalars["Boolean"]["input"];
  limit: Types.Scalars["Int"]["input"];
  offset: Types.Scalars["Int"]["input"];
  orderBy: Array<Types.Team_Order_By> | Types.Team_Order_By;
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
    memberships_aggregate?: {
      __typename?: "membership_aggregate";
      aggregate?: {
        __typename?: "membership_aggregate_fields";
        count: number;
      } | null;
    };
    apps_aggregate?: {
      __typename?: "app_aggregate";
      aggregate?: { __typename?: "app_aggregate_fields"; count: number } | null;
    };
    api_keys_aggregate?: {
      __typename?: "api_key_aggregate";
      aggregate?: {
        __typename?: "api_key_aggregate_fields";
        count: number;
      } | null;
    };
  }>;
  team_aggregate: {
    __typename?: "team_aggregate";
    aggregate?: { __typename?: "team_aggregate_fields"; count: number } | null;
  };
};

export type FetchAdminTeamPendingInvitesQueryVariables = Types.Exact<{
  teamIds:
    | Array<Types.Scalars["String"]["input"]>
    | Types.Scalars["String"]["input"];
}>;

export type FetchAdminTeamPendingInvitesQuery = {
  __typename?: "query_root";
  invite: Array<{ __typename?: "invite"; team_id: string }>;
};

export const FetchAdminTeamsDocument = gql`
  query FetchAdminTeams(
    $includeActiveApiKeysCount: Boolean!
    $includeAppsCount: Boolean!
    $includeCreatedAt: Boolean!
    $includeMembersCount: Boolean!
    $includeStatus: Boolean!
    $limit: Int!
    $offset: Int!
    $orderBy: [team_order_by!]!
    $where: team_bool_exp!
  ) {
    team(limit: $limit, offset: $offset, order_by: $orderBy, where: $where) {
      id
      name
      created_at @include(if: $includeCreatedAt)
      deleted_at @include(if: $includeStatus)
      memberships_aggregate @include(if: $includeMembersCount) {
        aggregate {
          count
        }
      }
      apps_aggregate(where: { deleted_at: { _is_null: true } })
        @include(if: $includeAppsCount) {
        aggregate {
          count
        }
      }
      api_keys_aggregate(where: { is_active: { _eq: true } })
        @include(if: $includeActiveApiKeysCount) {
        aggregate {
          count
        }
      }
    }
    team_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;
export const FetchAdminTeamPendingInvitesDocument = gql`
  query FetchAdminTeamPendingInvites($teamIds: [String!]!) {
    invite(
      where: { expires_at: { _gte: "now()" }, team_id: { _in: $teamIds } }
    ) {
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
      variables: FetchAdminTeamsQueryVariables,
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
    FetchAdminTeamPendingInvites(
      variables: FetchAdminTeamPendingInvitesQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAdminTeamPendingInvitesQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAdminTeamPendingInvitesQuery>(
            FetchAdminTeamPendingInvitesDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchAdminTeamPendingInvites",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
