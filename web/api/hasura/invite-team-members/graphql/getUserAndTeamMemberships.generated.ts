/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetUserAndTeamMembershipsQueryVariables = Types.Exact<{
  team_id: Types.Scalars["String"]["input"];
  user_id: Types.Scalars["String"]["input"];
}>;

export type GetUserAndTeamMembershipsQuery = {
  __typename?: "query_root";
  user: Array<{
    __typename?: "user";
    id: string;
    name: string;
    email?: string | null;
    team?: { __typename?: "team"; id: string; name?: string | null } | null;
  }>;
  membership: Array<{
    __typename?: "membership";
    user: { __typename?: "user"; email?: string | null };
    team: { __typename?: "team"; id: string; name?: string | null };
  }>;
};

export const GetUserAndTeamMembershipsDocument = gql`
  query GetUserAndTeamMemberships($team_id: String!, $user_id: String!) {
    user(
      where: {
        id: { _eq: $user_id }
        memberships: {
          team_id: { _eq: $team_id }
          role: { _in: [OWNER, ADMIN] }
        }
      }
    ) {
      id
      name
      email
      team {
        id
        name
      }
    }
    membership(where: { team_id: { _eq: $team_id } }) {
      user {
        email
      }
      team {
        id
        name
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
    GetUserAndTeamMemberships(
      variables: GetUserAndTeamMembershipsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetUserAndTeamMembershipsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetUserAndTeamMembershipsQuery>(
            GetUserAndTeamMembershipsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetUserAndTeamMemberships",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
