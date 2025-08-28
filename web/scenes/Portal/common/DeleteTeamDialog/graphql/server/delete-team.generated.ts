/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type DeleteTeamMutationVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type DeleteTeamMutation = {
  __typename?: "mutation_root";
  delete_invite?: {
    __typename?: "invite_mutation_response";
    affected_rows: number;
  } | null;
  delete_membership?: {
    __typename?: "membership_mutation_response";
    affected_rows: number;
  } | null;
  delete_api_key?: {
    __typename?: "api_key_mutation_response";
    affected_rows: number;
  } | null;
  update_app?: {
    __typename?: "app_mutation_response";
    affected_rows: number;
  } | null;
  update_team_by_pk?: {
    __typename?: "team";
    id: string;
    deleted_at?: string | null;
  } | null;
};

export const DeleteTeamDocument = gql`
  mutation DeleteTeam($id: String!) {
    delete_invite(where: { team_id: { _eq: $id } }) {
      affected_rows
    }
    delete_membership(where: { team_id: { _eq: $id } }) {
      affected_rows
    }
    delete_api_key(where: { team_id: { _eq: $id } }) {
      affected_rows
    }
    update_app(
      where: { team_id: { _eq: $id }, deleted_at: { _is_null: true } }
      _set: { deleted_at: "now()" }
    ) {
      affected_rows
    }
    update_team_by_pk(pk_columns: { id: $id }, _set: { deleted_at: "now()" }) {
      id
      deleted_at
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
