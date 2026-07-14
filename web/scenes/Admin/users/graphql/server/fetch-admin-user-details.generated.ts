import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";

type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];

export type FetchAdminUserDetailsQueryVariables = Types.Exact<{
  userId: Types.Scalars["String"]["input"];
}>;

export type FetchAdminUserDetailsQuery = {
  __typename?: "query_root";
  user_by_pk?: {
    __typename?: "user";
    id: string;
    name: string;
    email?: string | null;
    created_at: string;
  } | null;
  memberships: {
    __typename?: "membership_aggregate";
    aggregate?: {
      __typename?: "membership_aggregate_fields";
      count: number;
    } | null;
  };
  owners: {
    __typename?: "membership_aggregate";
    aggregate?: {
      __typename?: "membership_aggregate_fields";
      count: number;
    } | null;
  };
  admins: {
    __typename?: "membership_aggregate";
    aggregate?: {
      __typename?: "membership_aggregate_fields";
      count: number;
    } | null;
  };
  members: {
    __typename?: "membership_aggregate";
    aggregate?: {
      __typename?: "membership_aggregate_fields";
      count: number;
    } | null;
  };
  apps: {
    __typename?: "app_aggregate";
    aggregate?: { __typename?: "app_aggregate_fields"; count: number } | null;
  };
  owner_memberships: Array<{
    __typename?: "membership";
    id: string;
    team: {
      __typename?: "team";
      id: string;
      name: string;
      deleted_at?: string | null;
      memberships_aggregate: {
        __typename?: "membership_aggregate";
        aggregate?: {
          __typename?: "membership_aggregate_fields";
          count: number;
        } | null;
      };
    };
  }>;
  deleted_team_memberships: Array<{
    __typename?: "membership";
    id: string;
    team: {
      __typename?: "team";
      id: string;
      name: string;
      deleted_at?: string | null;
    };
  }>;
};

export const FetchAdminUserDetailsDocument = gql`
  query FetchAdminUserDetails($userId: String!) {
    user_by_pk(id: $userId) {
      id
      name
      email
      created_at
    }
    memberships: membership_aggregate(where: { user_id: { _eq: $userId } }) {
      aggregate {
        count
      }
    }
    owners: membership_aggregate(
      where: { user_id: { _eq: $userId }, role: { _eq: OWNER } }
    ) {
      aggregate {
        count
      }
    }
    admins: membership_aggregate(
      where: { user_id: { _eq: $userId }, role: { _eq: ADMIN } }
    ) {
      aggregate {
        count
      }
    }
    members: membership_aggregate(
      where: { user_id: { _eq: $userId }, role: { _eq: MEMBER } }
    ) {
      aggregate {
        count
      }
    }
    apps: app_aggregate(
      where: {
        deleted_at: { _is_null: true }
        team: { memberships: { user_id: { _eq: $userId } } }
      }
    ) {
      aggregate {
        count
      }
    }
    owner_memberships: membership(
      where: { user_id: { _eq: $userId }, role: { _eq: OWNER } }
    ) {
      id
      team {
        id
        name
        deleted_at
        memberships_aggregate(where: { role: { _eq: OWNER } }) {
          aggregate {
            count
          }
        }
      }
    }
    deleted_team_memberships: membership(
      where: {
        user_id: { _eq: $userId }
        team: { deleted_at: { _is_null: false } }
      }
    ) {
      id
      team {
        id
        name
        deleted_at
      }
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
    FetchAdminUserDetails(
      variables?: FetchAdminUserDetailsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAdminUserDetailsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAdminUserDetailsQuery>(
            FetchAdminUserDetailsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchAdminUserDetails",
        "query",
        variables,
      );
    },
  };
}

export type Sdk = ReturnType<typeof getSdk>;
