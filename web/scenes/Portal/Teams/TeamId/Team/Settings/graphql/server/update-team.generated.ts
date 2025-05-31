/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateTeamMutationVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
  input?: Types.InputMaybe<Types.Team_Set_Input>;
}>;

export type UpdateTeamMutation = {
  __typename?: "mutation_root";
  update_team_by_pk?: { __typename?: "team"; id: string } | null;
};

export const UpdateTeamDocument = gql`
  mutation UpdateTeam($id: String!, $input: team_set_input = {}) {
    update_team_by_pk(pk_columns: { id: $id }, _set: $input) {
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
    UpdateTeam(
      variables: UpdateTeamMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateTeamMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateTeamMutation>(UpdateTeamDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "UpdateTeam",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
