/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateActionV4MutationVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
  input: Types.Action_V4_Set_Input;
}>;

export type UpdateActionV4Mutation = {
  __typename?: "mutation_root";
  update_action_v4_by_pk?: {
    __typename?: "action_v4";
    id: string;
    action: string;
    description: string;
    environment: unknown;
    updated_at: string;
  } | null;
};

export const UpdateActionV4Document = gql`
  mutation UpdateActionV4($id: String!, $input: action_v4_set_input!) {
    update_action_v4_by_pk(pk_columns: { id: $id }, _set: $input) {
      id
      action
      description
      environment
      updated_at
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
    UpdateActionV4(
      variables: UpdateActionV4MutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateActionV4Mutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateActionV4Mutation>(
            UpdateActionV4Document,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "UpdateActionV4",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
