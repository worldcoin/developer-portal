import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";

type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];

export type FetchAdminHomeQueryVariables = Types.Exact<{
  recentLimit: Types.Scalars["Int"]["input"];
}>;

export type FetchAdminHomeQuery = {
  __typename?: "query_root";
  inventory: Array<{
    __typename?: "admin_dashboard_inventory";
    active_api_keys: number;
    active_apps: number;
    active_teams: number;
    deleted_apps: number;
    deleted_teams: number;
    new_apps: number;
    new_teams: number;
    new_users: number;
    pending_invites: number;
    total_users: number;
  }>;
  queues: Array<{
    __typename?: "admin_dashboard_queue";
    email?: string | null;
    id: string;
    kind: string;
    name?: string | null;
    owner_email?: string | null;
    owner_id?: string | null;
    owner_name?: string | null;
    team_id?: string | null;
    total_count: number;
    updated_at?: string | null;
  }>;
  recent_apps: Array<{
    __typename?: "app";
    created_at: string;
    draft_metadata: Array<{
      __typename?: "app_metadata";
      verification_status: string;
    }>;
    id: string;
    name: string;
    team_id: string;
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
  recent_teams: Array<{
    __typename?: "team";
    created_at: string;
    deleted_at?: string | null;
    id: string;
    name?: string | null;
  }>;
  recent_users: Array<{
    __typename?: "user";
    created_at: string;
    email?: string | null;
    id: string;
    name: string;
  }>;
};

export const FetchAdminHomeDocument = gql`
  query FetchAdminHome($recentLimit: Int!) {
    inventory: admin_dashboard_inventory {
      active_api_keys
      active_apps
      active_teams
      deleted_apps
      deleted_teams
      new_apps
      new_teams
      new_users
      pending_invites
      total_users
    }
    queues: admin_dashboard_queues {
      email
      id
      kind
      name
      owner_email
      owner_id
      owner_name
      team_id
      total_count
      updated_at
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
  variables?: unknown,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (action) => action();

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
