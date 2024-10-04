/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type DeleteTeamMutationVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type DeleteTeamMutation = {
  __typename?: "mutation_root";
  delete_team_by_pk?: { __typename?: "team"; id: string } | null;
};

export const DeleteTeamDocument = gql`
  mutation DeleteTeam($id: String!) {
    delete_team_by_pk(id: $id) {
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
    DeleteTeam(
      variables: DeleteTeamMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<DeleteTeamMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<DeleteTeamMutation>(DeleteTeamDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "DeleteTeam",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
