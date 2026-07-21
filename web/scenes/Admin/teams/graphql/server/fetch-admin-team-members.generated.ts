/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchAdminTeamMembersQueryVariables = Types.Exact<{
  limit: Types.Scalars["Int"]["input"];
  offset: Types.Scalars["Int"]["input"];
  where: Types.Membership_Bool_Exp;
}>;

export type FetchAdminTeamMembersQuery = {
  __typename?: "query_root";
  membership: Array<{
    __typename?: "membership";
    id: string;
    role: Types.Role_Enum;
    user_id: string;
    user: {
      __typename?: "user";
      id: string;
      name: string;
      email?: string | null;
      created_at: string;
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

export const FetchAdminTeamMembersDocument = gql`
  query FetchAdminTeamMembers(
    $limit: Int!
    $offset: Int!
    $where: membership_bool_exp!
  ) {
    membership(
      limit: $limit
      offset: $offset
      order_by: [{ user: { name: asc } }, { id: asc }]
      where: $where
    ) {
      id
      role
      user_id
      user {
        id
        name
        email
        created_at
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
    FetchAdminTeamMembers(
      variables: FetchAdminTeamMembersQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAdminTeamMembersQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAdminTeamMembersQuery>(
            FetchAdminTeamMembersDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchAdminTeamMembers",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
