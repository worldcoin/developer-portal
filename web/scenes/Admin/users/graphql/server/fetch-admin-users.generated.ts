/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchAdminUsersQueryVariables = Types.Exact<{
  includeCreatedAt: Types.Scalars["Boolean"]["input"];
  includeEmail: Types.Scalars["Boolean"]["input"];
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
  }>;
  user_aggregate: {
    __typename?: "user_aggregate";
    aggregate?: { __typename?: "user_aggregate_fields"; count: number } | null;
  };
};

export type FetchAdminUserMembershipsQueryVariables = Types.Exact<{
  userIds:
    | Array<Types.Scalars["String"]["input"]>
    | Types.Scalars["String"]["input"];
}>;

export type FetchAdminUserMembershipsQuery = {
  __typename?: "query_root";
  membership: Array<{ __typename?: "membership"; user_id: string }>;
};

export const FetchAdminUsersDocument = gql`
  query FetchAdminUsers(
    $includeCreatedAt: Boolean!
    $includeEmail: Boolean!
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
    }
    user_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;
export const FetchAdminUserMembershipsDocument = gql`
  query FetchAdminUserMemberships($userIds: [String!]!) {
    membership(where: { user_id: { _in: $userIds } }) {
      user_id
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
    FetchAdminUsers(
      variables: FetchAdminUsersQueryVariables,
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
    FetchAdminUserMemberships(
      variables: FetchAdminUserMembershipsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAdminUserMembershipsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAdminUserMembershipsQuery>(
            FetchAdminUserMembershipsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchAdminUserMemberships",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
