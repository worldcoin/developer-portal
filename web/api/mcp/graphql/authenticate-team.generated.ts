/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type McpAuthenticateTeamQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type McpAuthenticateTeamQuery = {
  __typename?: "query_root";
  api_key_by_pk?: {
    __typename?: "api_key";
    id: string;
    api_key: string;
    is_active: boolean;
    team_id: string;
  } | null;
};

export const McpAuthenticateTeamDocument = gql`
  query McpAuthenticateTeam($id: String!) {
    api_key_by_pk(id: $id) {
      id
      api_key
      is_active
      team_id
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
    McpAuthenticateTeam(
      variables: McpAuthenticateTeamQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<McpAuthenticateTeamQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<McpAuthenticateTeamQuery>(
            McpAuthenticateTeamDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "McpAuthenticateTeam",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
