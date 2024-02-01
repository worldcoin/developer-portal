/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type GetMembershipQueryVariables = Types.Exact<{
  team_id: Types.Scalars["String"];
  user_id: Types.Scalars["String"];
  app_id: Types.Scalars["String"];
}>;

export type GetMembershipQuery = {
  __typename?: "query_root";
  team: Array<{ __typename?: "team"; id: string }>;
};

export const GetMembershipDocument = gql`
  query GetMembership($team_id: String!, $user_id: String!, $app_id: String!) {
    team(
      where: {
        id: { _eq: $team_id }
        memberships: {
          user_id: { _eq: $user_id }
          role: { _in: [ADMIN, OWNER] }
        }
        apps: { id: { _eq: $app_id } }
      }
    ) {
      id
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
    GetMembership(
      variables: GetMembershipQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders
    ): Promise<GetMembershipQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetMembershipQuery>(GetMembershipDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "GetMembership",
        "query"
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
