/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetTeamInviteContextQueryVariables = Types.Exact<{
  team_id: Types.Scalars["String"]["input"];
  email: Types.Scalars["String"]["input"];
}>;

export type GetTeamInviteContextQuery = {
  __typename?: "query_root";
  team?: {
    __typename?: "team";
    id: string;
    name?: string | null;
    deleted_at?: string | null;
  } | null;
  membership: Array<{ __typename?: "membership"; id: string }>;
  invite: Array<{ __typename?: "invite"; id: string }>;
};

export const GetTeamInviteContextDocument = gql`
  query GetTeamInviteContext($team_id: String!, $email: String!) {
    team: team_by_pk(id: $team_id) {
      id
      name
      deleted_at
    }
    membership(
      where: { team_id: { _eq: $team_id }, user: { email: { _eq: $email } } }
      limit: 1
    ) {
      id
    }
    invite(where: { team_id: { _eq: $team_id }, email: { _eq: $email } }) {
      id
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
    GetTeamInviteContext(
      variables: GetTeamInviteContextQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetTeamInviteContextQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetTeamInviteContextQuery>(
            GetTeamInviteContextDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetTeamInviteContext",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
