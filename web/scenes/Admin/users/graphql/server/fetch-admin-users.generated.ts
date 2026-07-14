import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";

type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];

export type FetchAdminUsersQueryVariables = Types.Exact<{
  includeCreatedAt: Types.Scalars["Boolean"]["input"];
  includeEmail: Types.Scalars["Boolean"]["input"];
  includeTeamsCount: Types.Scalars["Boolean"]["input"];
  limit: Types.Scalars["Int"]["input"];
  offset: Types.Scalars["Int"]["input"];
  orderBy: Array<Types.User_Order_By> | Types.User_Order_By;
  where: Types.User_Bool_Exp;
}>;

export type FetchAdminUsersQuery = {
  __typename?: "query_root";
  user: Array<{
    __typename?: "user";
    id: string;
    name: string;
    email?: string | null;
    created_at?: string;
    memberships_aggregate?: {
      __typename?: "membership_aggregate";
      aggregate?: {
        __typename?: "membership_aggregate_fields";
        count: number;
      } | null;
    };
  }>;
  user_aggregate: {
    __typename?: "user_aggregate";
    aggregate?: {
      __typename?: "user_aggregate_fields";
      count: number;
    } | null;
  };
};

export const FetchAdminUsersDocument = gql`
  query FetchAdminUsers(
    $includeCreatedAt: Boolean!
    $includeEmail: Boolean!
    $includeTeamsCount: Boolean!
    $limit: Int!
    $offset: Int!
    $orderBy: [user_order_by!]!
    $where: user_bool_exp!
  ) {
    user(limit: $limit, offset: $offset, order_by: $orderBy, where: $where) {
      id
      name
      email @include(if: $includeEmail)
      created_at @include(if: $includeCreatedAt)
      memberships_aggregate @include(if: $includeTeamsCount) {
        aggregate {
          count
        }
      }
    }
    user_aggregate(where: $where) {
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
    FetchAdminUsers(
      variables?: FetchAdminUsersQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAdminUsersQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAdminUsersQuery>(
            FetchAdminUsersDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchAdminUsers",
        "query",
        variables,
      );
    },
  };
}

export type Sdk = ReturnType<typeof getSdk>;
