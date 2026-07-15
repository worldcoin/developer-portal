/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchAdminHomeQueryVariables = Types.Exact<{
  recentSince: Types.Scalars["timestamptz"]["input"];
  recentLimit: Types.Scalars["Int"]["input"];
}>;

export type FetchAdminHomeQuery = {
  __typename?: "query_root";
  active_teams: {
    __typename?: "team_aggregate";
    aggregate?: { __typename?: "team_aggregate_fields"; count: number } | null;
  };
  deleted_teams: {
    __typename?: "team_aggregate";
    aggregate?: { __typename?: "team_aggregate_fields"; count: number } | null;
  };
  new_teams: {
    __typename?: "team_aggregate";
    aggregate?: { __typename?: "team_aggregate_fields"; count: number } | null;
  };
  total_users: {
    __typename?: "user_aggregate";
    aggregate?: { __typename?: "user_aggregate_fields"; count: number } | null;
  };
  new_users: {
    __typename?: "user_aggregate";
    aggregate?: { __typename?: "user_aggregate_fields"; count: number } | null;
  };
  active_apps: {
    __typename?: "app_aggregate";
    aggregate?: { __typename?: "app_aggregate_fields"; count: number } | null;
  };
  deleted_apps: {
    __typename?: "app_aggregate";
    aggregate?: { __typename?: "app_aggregate_fields"; count: number } | null;
  };
  new_apps: {
    __typename?: "app_aggregate";
    aggregate?: { __typename?: "app_aggregate_fields"; count: number } | null;
  };
  pending_invites: {
    __typename?: "invite_aggregate";
    aggregate?: {
      __typename?: "invite_aggregate_fields";
      count: number;
    } | null;
  };
  active_api_keys: {
    __typename?: "api_key_aggregate";
    aggregate?: {
      __typename?: "api_key_aggregate_fields";
      count: number;
    } | null;
  };
  teams_without_owner: Array<{
    __typename?: "team";
    id: string;
    name?: string | null;
    created_at: string;
  }>;
  teams_without_owner_count: {
    __typename?: "team_aggregate";
    aggregate?: { __typename?: "team_aggregate_fields"; count: number } | null;
  };
  users_without_teams: Array<{
    __typename?: "user";
    id: string;
    name: string;
    email?: string | null;
    created_at: string;
  }>;
  users_without_teams_count: {
    __typename?: "user_aggregate";
    aggregate?: { __typename?: "user_aggregate_fields"; count: number } | null;
  };
  apps_without_metadata: Array<{
    __typename?: "app";
    id: string;
    name: string;
    team_id: string;
    created_at: string;
  }>;
  apps_without_metadata_count: {
    __typename?: "app_aggregate";
    aggregate?: { __typename?: "app_aggregate_fields"; count: number } | null;
  };
  sole_owner_memberships: Array<{
    __typename?: "membership";
    user: {
      __typename?: "user";
      id: string;
      name: string;
      email?: string | null;
    };
    team: {
      __typename?: "team";
      id: string;
      name?: string | null;
      memberships_aggregate: {
        __typename?: "membership_aggregate";
        aggregate?: {
          __typename?: "membership_aggregate_fields";
          count: number;
        } | null;
      };
    };
  }>;
  sole_owner_memberships_count: {
    __typename?: "membership_aggregate";
    aggregate?: {
      __typename?: "membership_aggregate_fields";
      count: number;
    } | null;
  };
  apps_awaiting_review: Array<{
    __typename?: "app";
    id: string;
    name: string;
    team_id: string;
    draft_metadata: Array<{
      __typename?: "app_metadata";
      name: string;
      updated_at: string;
      verification_status: string;
    }>;
    verified_metadata: Array<{
      __typename?: "app_metadata";
      name: string;
      verified_at?: string | null;
      verification_status: string;
    }>;
  }>;
  apps_awaiting_review_count: {
    __typename?: "app_aggregate";
    aggregate?: { __typename?: "app_aggregate_fields"; count: number } | null;
  };
  apps_changes_requested: Array<{
    __typename?: "app";
    id: string;
    name: string;
    team_id: string;
    draft_metadata: Array<{
      __typename?: "app_metadata";
      name: string;
      updated_at: string;
      verification_status: string;
    }>;
    verified_metadata: Array<{
      __typename?: "app_metadata";
      name: string;
      verified_at?: string | null;
      verification_status: string;
    }>;
  }>;
  apps_changes_requested_count: {
    __typename?: "app_aggregate";
    aggregate?: { __typename?: "app_aggregate_fields"; count: number } | null;
  };
  recent_teams: Array<{
    __typename?: "team";
    id: string;
    name?: string | null;
    created_at: string;
    deleted_at?: string | null;
  }>;
  recent_users: Array<{
    __typename?: "user";
    id: string;
    name: string;
    email?: string | null;
    created_at: string;
  }>;
  recent_apps: Array<{
    __typename?: "app";
    id: string;
    name: string;
    team_id: string;
    created_at: string;
    draft_metadata: Array<{
      __typename?: "app_metadata";
      verification_status: string;
    }>;
    verified_metadata: Array<{
      __typename?: "app_metadata";
      verification_status: string;
    }>;
  }>;
  recent_metadata: Array<{
    __typename?: "app_metadata";
    app_id: string;
    name: string;
    updated_at: string;
    verification_status: string;
  }>;
};

export const FetchAdminHomeDocument = gql`
  query FetchAdminHome($recentSince: timestamptz!, $recentLimit: Int!) {
    active_teams: team_aggregate(where: { deleted_at: { _is_null: true } }) {
      aggregate {
        count
      }
    }
    deleted_teams: team_aggregate(where: { deleted_at: { _is_null: false } }) {
      aggregate {
        count
      }
    }
    new_teams: team_aggregate(
      where: {
        deleted_at: { _is_null: true }
        created_at: { _gte: $recentSince }
      }
    ) {
      aggregate {
        count
      }
    }
    total_users: user_aggregate {
      aggregate {
        count
      }
    }
    new_users: user_aggregate(where: { created_at: { _gte: $recentSince } }) {
      aggregate {
        count
      }
    }
    active_apps: app_aggregate(where: { deleted_at: { _is_null: true } }) {
      aggregate {
        count
      }
    }
    deleted_apps: app_aggregate(where: { deleted_at: { _is_null: false } }) {
      aggregate {
        count
      }
    }
    new_apps: app_aggregate(
      where: {
        deleted_at: { _is_null: true }
        created_at: { _gte: $recentSince }
      }
    ) {
      aggregate {
        count
      }
    }
    pending_invites: invite_aggregate(
      where: { expires_at: { _gte: "now()" } }
    ) {
      aggregate {
        count
      }
    }
    active_api_keys: api_key_aggregate(where: { is_active: { _eq: true } }) {
      aggregate {
        count
      }
    }
    teams_without_owner: team(
      where: {
        _and: [
          { deleted_at: { _is_null: true } }
          { _not: { memberships: { role: { _eq: OWNER } } } }
        ]
      }
      order_by: { created_at: desc }
      limit: $recentLimit
    ) {
      id
      name
      created_at
    }
    teams_without_owner_count: team_aggregate(
      where: {
        _and: [
          { deleted_at: { _is_null: true } }
          { _not: { memberships: { role: { _eq: OWNER } } } }
        ]
      }
    ) {
      aggregate {
        count
      }
    }
    users_without_teams: user(
      where: { _not: { memberships: {} } }
      order_by: { created_at: desc }
      limit: $recentLimit
    ) {
      id
      name
      email
      created_at
    }
    users_without_teams_count: user_aggregate(
      where: { _not: { memberships: {} } }
    ) {
      aggregate {
        count
      }
    }
    apps_without_metadata: app(
      where: {
        _and: [
          { deleted_at: { _is_null: true } }
          { _not: { app_metadata: {} } }
        ]
      }
      order_by: { created_at: desc }
      limit: $recentLimit
    ) {
      id
      name
      team_id
      created_at
    }
    apps_without_metadata_count: app_aggregate(
      where: {
        _and: [
          { deleted_at: { _is_null: true } }
          { _not: { app_metadata: {} } }
        ]
      }
    ) {
      aggregate {
        count
      }
    }
    sole_owner_memberships: membership(
      where: {
        role: { _eq: OWNER }
        team: {
          deleted_at: { _is_null: true }
          memberships_aggregate: {
            count: { filter: { role: { _eq: OWNER } }, predicate: { _eq: 1 } }
          }
        }
      }
      limit: $recentLimit
    ) {
      user {
        id
        name
        email
      }
      team {
        id
        name
        memberships_aggregate(where: { role: { _eq: OWNER } }) {
          aggregate {
            count
          }
        }
      }
    }
    sole_owner_memberships_count: membership_aggregate(
      where: {
        role: { _eq: OWNER }
        team: {
          deleted_at: { _is_null: true }
          memberships_aggregate: {
            count: { filter: { role: { _eq: OWNER } }, predicate: { _eq: 1 } }
          }
        }
      }
    ) {
      aggregate {
        count
      }
    }
    apps_awaiting_review: app(
      where: {
        deleted_at: { _is_null: true }
        app_metadata: { verification_status: { _eq: "awaiting_review" } }
      }
      order_by: { created_at: desc }
      limit: $recentLimit
    ) {
      id
      name
      team_id
      draft_metadata: app_metadata(
        where: { verification_status: { _neq: "verified" } }
        order_by: { updated_at: desc }
        limit: 1
      ) {
        name
        updated_at
        verification_status
      }
      verified_metadata: app_metadata(
        where: { verification_status: { _eq: "verified" } }
        order_by: { verified_at: desc }
        limit: 1
      ) {
        name
        verified_at
        verification_status
      }
    }
    apps_awaiting_review_count: app_aggregate(
      where: {
        deleted_at: { _is_null: true }
        app_metadata: { verification_status: { _eq: "awaiting_review" } }
      }
    ) {
      aggregate {
        count
      }
    }
    apps_changes_requested: app(
      where: {
        deleted_at: { _is_null: true }
        app_metadata: { verification_status: { _eq: "changes_requested" } }
      }
      order_by: { created_at: desc }
      limit: $recentLimit
    ) {
      id
      name
      team_id
      draft_metadata: app_metadata(
        where: { verification_status: { _neq: "verified" } }
        order_by: { updated_at: desc }
        limit: 1
      ) {
        name
        updated_at
        verification_status
      }
      verified_metadata: app_metadata(
        where: { verification_status: { _eq: "verified" } }
        order_by: { verified_at: desc }
        limit: 1
      ) {
        name
        verified_at
        verification_status
      }
    }
    apps_changes_requested_count: app_aggregate(
      where: {
        deleted_at: { _is_null: true }
        app_metadata: { verification_status: { _eq: "changes_requested" } }
      }
    ) {
      aggregate {
        count
      }
    }
    recent_teams: team(order_by: { created_at: desc }, limit: $recentLimit) {
      id
      name
      created_at
      deleted_at
    }
    recent_users: user(order_by: { created_at: desc }, limit: $recentLimit) {
      id
      name
      email
      created_at
    }
    recent_apps: app(
      where: { deleted_at: { _is_null: true } }
      order_by: { created_at: desc }
      limit: $recentLimit
    ) {
      id
      name
      team_id
      created_at
      draft_metadata: app_metadata(
        where: { verification_status: { _neq: "verified" } }
        order_by: { updated_at: desc }
        limit: 1
      ) {
        verification_status
      }
      verified_metadata: app_metadata(
        where: { verification_status: { _eq: "verified" } }
        order_by: { verified_at: desc }
        limit: 1
      ) {
        verification_status
      }
    }
    recent_metadata: app_metadata(
      order_by: { updated_at: desc }
      limit: $recentLimit
    ) {
      app_id
      name
      updated_at
      verification_status
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
    FetchAdminHome(
      variables: FetchAdminHomeQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAdminHomeQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAdminHomeQuery>(
            FetchAdminHomeDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchAdminHome",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
