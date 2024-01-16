/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type GetTeamsByUserIdQueryVariables = Types.Exact<{
  user_id: Types.Scalars["String"];
}>;

export type GetTeamsByUserIdQuery = {
  __typename?: "query_root";
  team: Array<{ __typename?: "team"; id: string }>;
};

export const GetTeamsByUserIdDocument = gql`
  query GetTeamsByUserId($user_id: String!) {
    team(where: { memberships: { user_id: { _eq: $user_id } } }) {
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
    GetTeamsByUserId(
      variables: GetTeamsByUserIdQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders
    ): Promise<GetTeamsByUserIdQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetTeamsByUserIdQuery>(
            GetTeamsByUserIdDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders }
          ),
        "GetTeamsByUserId",
        "query"
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
