import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";

type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];

export type FetchAdminUserTeamsQueryVariables = Types.Exact<{
  limit: Types.Scalars["Int"]["input"];
  offset: Types.Scalars["Int"]["input"];
  where: Types.Membership_Bool_Exp;
}>;

export type FetchAdminUserTeamsQuery = {
  __typename?: "query_root";
  membership: Array<{
    __typename?: "membership";
    id: string;
    role: Types.Role_Enum;
    team_id: string;
    team: {
      __typename?: "team";
      id: string;
      name: string;
      deleted_at?: string | null;
    };
  }>;
  membership_aggregate: {
    __typename?: "membership_aggregate";
    aggregate?: {
      __typename?: "membership_aggregate_fields";
      count: number;
    } | null;
  };
};

export const FetchAdminUserTeamsDocument = gql`
  query FetchAdminUserTeams(
    $limit: Int!
    $offset: Int!
    $where: membership_bool_exp!
  ) {
    membership(
      limit: $limit
      offset: $offset
      order_by: { team: { name: asc } }
      where: $where
    ) {
      id
      role
      team_id
      team {
        id
        name
        deleted_at
      }
    }
    membership_aggregate(where: $where) {
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
  variables?: unknown,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (action) => action();

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper,
) {
  return {
    FetchAdminUserTeams(
      variables?: FetchAdminUserTeamsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAdminUserTeamsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAdminUserTeamsQuery>(
            FetchAdminUserTeamsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchAdminUserTeams",
        "query",
        variables,
      );
    },
  };
}

export type Sdk = ReturnType<typeof getSdk>;
