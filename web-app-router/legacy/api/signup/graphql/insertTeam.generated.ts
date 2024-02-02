/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type InsertTeamMutationVariables = Types.Exact<{
  team_name: Types.Scalars["String"];
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
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType,
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
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
