/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchAdminTeamDetailsQueryVariables = Types.Exact<{
  teamId: Types.Scalars["String"]["input"];
}>;

export type FetchAdminTeamDetailsQuery = {
  __typename?: "query_root";
  team_by_pk?: {
    __typename?: "team";
    id: string;
    name?: string | null;
    created_at: string;
    deleted_at?: string | null;
  } | null;
  membership_aggregate: {
    __typename?: "membership_aggregate";
    aggregate?: {
      __typename?: "membership_aggregate_fields";
      count: number;
    } | null;
  };
  app_aggregate: {
    __typename?: "app_aggregate";
    aggregate?: { __typename?: "app_aggregate_fields"; count: number } | null;
  };
  invite_aggregate: {
    __typename?: "invite_aggregate";
    aggregate?: {
      __typename?: "invite_aggregate_fields";
      count: number;
    } | null;
  };
  api_key_aggregate: {
    __typename?: "api_key_aggregate";
    aggregate?: {
      __typename?: "api_key_aggregate_fields";
      count: number;
    } | null;
  };
  invite: Array<{
    __typename?: "invite";
    id: string;
    email: string;
    expires_at: string;
  }>;
  api_key: Array<{
    __typename?: "api_key";
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    is_active: boolean;
  }>;
};

export const FetchAdminTeamDetailsDocument = gql`
  query FetchAdminTeamDetails($teamId: String!) {
    team_by_pk(id: $teamId) {
      id
      name
      created_at
      deleted_at
    }
    membership_aggregate(where: { team_id: { _eq: $teamId } }) {
      aggregate {
        count
      }
    }
    app_aggregate(
      where: { team_id: { _eq: $teamId }, deleted_at: { _is_null: true } }
    ) {
      aggregate {
        count
      }
    }
    invite_aggregate(
      where: { team_id: { _eq: $teamId }, expires_at: { _gte: "now()" } }
    ) {
      aggregate {
        count
      }
    }
    api_key_aggregate(
      where: { team_id: { _eq: $teamId }, is_active: { _eq: true } }
    ) {
      aggregate {
        count
      }
    }
    invite(
      where: { team_id: { _eq: $teamId } }
      order_by: { expires_at: asc }
      limit: 25
    ) {
      id
      email
      expires_at
    }
    api_key(
      where: { team_id: { _eq: $teamId } }
      order_by: [{ is_active: desc }, { created_at: desc }]
      limit: 25
    ) {
      id
      name
      created_at
      updated_at
      is_active
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
    FetchAdminTeamDetails(
      variables: FetchAdminTeamDetailsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAdminTeamDetailsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAdminTeamDetailsQuery>(
            FetchAdminTeamDetailsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchAdminTeamDetails",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
