/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetAddTeamMemberContextQueryVariables = Types.Exact<{
  team_id: Types.Scalars["String"]["input"];
  email_pattern: Types.Scalars["String"]["input"];
}>;

export type GetAddTeamMemberContextQuery = {
  __typename?: "query_root";
  team?: { __typename?: "team"; id: string; deleted_at?: string | null } | null;
  user: Array<{
    __typename?: "user";
    id: string;
    memberships: Array<{ __typename?: "membership"; id: string }>;
  }>;
};

export const GetAddTeamMemberContextDocument = gql`
  query GetAddTeamMemberContext($team_id: String!, $email_pattern: String!) {
    team: team_by_pk(id: $team_id) {
      id
      deleted_at
    }
    user(where: { email: { _ilike: $email_pattern } }, limit: 2) {
      id
      memberships(where: { team_id: { _eq: $team_id } }, limit: 1) {
        id
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
    GetAddTeamMemberContext(
      variables: GetAddTeamMemberContextQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetAddTeamMemberContextQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetAddTeamMemberContextQuery>(
            GetAddTeamMemberContextDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetAddTeamMemberContext",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
