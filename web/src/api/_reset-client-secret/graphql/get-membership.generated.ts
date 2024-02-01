/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type GetMembershipQueryVariables = Types.Exact<{
  user_id: Types.Scalars["String"];
  team_id: Types.Scalars["String"];
}>;

export type GetMembershipQuery = {
  __typename?: "query_root";
  membership: Array<{ __typename?: "membership"; user_id: string }>;
};

export const GetMembershipDocument = gql`
  query GetMembership($user_id: String!, $team_id: String!) {
    membership(
      where: {
        _and: {
          team_id: { _eq: $team_id }
          user_id: { _eq: $user_id }
          role: { _in: [ADMIN, OWNER] }
        }
      }
    ) {
      user_id
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
