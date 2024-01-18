/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type GetTeamByUserIdQueryVariables = Types.Exact<{
  user_id: Types.Scalars["String"];
}>;

export type GetTeamByUserIdQuery = {
  __typename?: "query_root";
  team: Array<{ __typename?: "team"; id: string }>;
};

export const GetTeamByUserIdDocument = gql`
  query GetTeamByUserId($user_id: String!) {
    team(where: { memberships: { user_id: { _eq: $user_id } } }, limit: 1) {
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
    GetTeamByUserId(
      variables: GetTeamByUserIdQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders
    ): Promise<GetTeamByUserIdQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetTeamByUserIdQuery>(
            GetTeamByUserIdDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders }
          ),
        "GetTeamByUserId",
        "query"
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
