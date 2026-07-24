/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchAdminGlobalSearchQueryVariables = Types.Exact<{
  appsWhere: Types.App_Bool_Exp;
  includeApps: Types.Scalars["Boolean"]["input"];
  includeRps: Types.Scalars["Boolean"]["input"];
  includeTeams: Types.Scalars["Boolean"]["input"];
  includeUsers: Types.Scalars["Boolean"]["input"];
  limit: Types.Scalars["Int"]["input"];
  rpsWhere: Types.Rp_Registration_Bool_Exp;
  teamsWhere: Types.Team_Bool_Exp;
  usersWhere: Types.User_Bool_Exp;
}>;

export type FetchAdminGlobalSearchQuery = {
  __typename?: "query_root";
  apps?: Array<{
    __typename?: "app";
    id: string;
    name: string;
    team_id: string;
  }>;
  apps_aggregate?: {
    __typename?: "app_aggregate";
    aggregate?: { __typename?: "app_aggregate_fields"; count: number } | null;
  };
  rps?: Array<{
    __typename?: "rp_registration";
    rp_id: string;
    app_id: string;
    app: { __typename?: "app"; name: string };
  }>;
  rps_aggregate?: {
    __typename?: "rp_registration_aggregate";
    aggregate?: {
      __typename?: "rp_registration_aggregate_fields";
      count: number;
    } | null;
  };
  teams?: Array<{ __typename?: "team"; id: string; name?: string | null }>;
  teams_aggregate?: {
    __typename?: "team_aggregate";
    aggregate?: { __typename?: "team_aggregate_fields"; count: number } | null;
  };
  users?: Array<{
    __typename?: "user";
    id: string;
    name: string;
    email?: string | null;
  }>;
  users_aggregate?: {
    __typename?: "user_aggregate";
    aggregate?: { __typename?: "user_aggregate_fields"; count: number } | null;
  };
};

export const FetchAdminGlobalSearchDocument = gql`
  query FetchAdminGlobalSearch(
    $appsWhere: app_bool_exp!
    $includeApps: Boolean!
    $includeRps: Boolean!
    $includeTeams: Boolean!
    $includeUsers: Boolean!
    $limit: Int!
    $rpsWhere: rp_registration_bool_exp!
    $teamsWhere: team_bool_exp!
    $usersWhere: user_bool_exp!
  ) {
    apps: app(
      where: $appsWhere
      order_by: [{ name: asc }, { id: asc }]
      limit: $limit
    ) @include(if: $includeApps) {
      id
      name
      team_id
    }
    apps_aggregate: app_aggregate(where: $appsWhere)
      @include(if: $includeApps) {
      aggregate {
        count
      }
    }
    rps: rp_registration(
      where: $rpsWhere
      order_by: [{ rp_id: asc }]
      limit: $limit
    ) @include(if: $includeRps) {
      rp_id
      app_id
      app {
        name
      }
    }
    rps_aggregate: rp_registration_aggregate(where: $rpsWhere)
      @include(if: $includeRps) {
      aggregate {
        count
      }
    }
    teams: team(
      where: $teamsWhere
      order_by: [{ name: asc }, { id: asc }]
      limit: $limit
    ) @include(if: $includeTeams) {
      id
      name
    }
    teams_aggregate: team_aggregate(where: $teamsWhere)
      @include(if: $includeTeams) {
      aggregate {
        count
      }
    }
    users: user(
      where: $usersWhere
      order_by: [{ name: asc }, { id: asc }]
      limit: $limit
    ) @include(if: $includeUsers) {
      id
      name
      email
    }
    users_aggregate: user_aggregate(where: $usersWhere)
      @include(if: $includeUsers) {
      aggregate {
        count
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
    FetchAdminGlobalSearch(
      variables: FetchAdminGlobalSearchQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAdminGlobalSearchQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAdminGlobalSearchQuery>(
            FetchAdminGlobalSearchDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchAdminGlobalSearch",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
