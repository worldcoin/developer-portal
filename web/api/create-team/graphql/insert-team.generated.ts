/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type InsertTeamMutationVariables = Types.Exact<{
  team_name: Types.Scalars["String"]["input"];
}>;

export type InsertTeamMutation = {
  __typename?: "mutation_root";
  insert_team_one?: { __typename?: "team"; id: string } | null;
};

export const InsertTeamDocument = gql`
  mutation InsertTeam($team_name: String!) {
    insert_team_one(object: { name: $team_name }) {
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
    InsertTeam(
      variables: InsertTeamMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<InsertTeamMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<InsertTeamMutation>(InsertTeamDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "InsertTeam",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
