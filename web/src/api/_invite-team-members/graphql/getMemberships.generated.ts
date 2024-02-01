/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type GetMembershipsQueryVariables = Types.Exact<{
  team_id: Types.Scalars["String"];
  user_id: Types.Scalars["String"];
}>;

export type GetMembershipsQuery = {
  __typename?: "query_root";
  team: Array<{
    __typename?: "team";
    id: string;
    memberships: Array<{
      __typename?: "membership";
      user: {
        __typename?: "user";
        id: string;
        name: string;
        email?: string | null;
      };
    }>;
  }>;
  membership: Array<{
    __typename?: "membership";
    user: { __typename?: "user"; email?: string | null };
  }>;
};

export const GetMembershipsDocument = gql`
  query GetMemberships($team_id: String!, $user_id: String!) {
    team(
      where: {
        id: { _eq: $team_id }
        memberships: {
          user_id: { _eq: $user_id }
          role: { _in: [ADMIN, OWNER] }
        }
      }
    ) {
      id
      memberships {
        user {
          id
          name
          email
        }
      }
    }
    membership(where: { team_id: { _eq: $team_id } }) {
      user {
        email
      }
    }
  }
`;

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType
) => action();

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper
) {
  return {
    GetMemberships(
      variables: GetMembershipsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders
    ): Promise<GetMembershipsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetMembershipsQuery>(
            GetMembershipsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders }
          ),
        "GetMemberships",
        "query"
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
