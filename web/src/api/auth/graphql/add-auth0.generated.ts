/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type AddAuth0MutationVariables = Types.Exact<{
  id: Types.Scalars["String"];
  auth0Id: Types.Scalars["String"];
}>;

export type AddAuth0Mutation = {
  __typename?: "mutation_root";
  update_user_by_pk?: {
    __typename?: "user";
    id: string;
    team_id: string;
    auth0Id?: string | null;
  } | null;
};

export const AddAuth0Document = gql`
  mutation AddAuth0($id: String!, $auth0Id: String!) {
    update_user_by_pk(pk_columns: { id: $id }, _set: { auth0Id: $auth0Id }) {
      id
      team_id
      auth0Id
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
    AddAuth0(
      variables: AddAuth0MutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders
    ): Promise<AddAuth0Mutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<AddAuth0Mutation>(AddAuth0Document, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "AddAuth0",
        "mutation"
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
