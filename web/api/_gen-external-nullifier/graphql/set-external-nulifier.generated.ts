/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type SetExternalNullifierMutationVariables = Types.Exact<{
  action_id: Types.Scalars["String"]["input"];
  external_nullifier: Types.Scalars["String"]["input"];
}>;

export type SetExternalNullifierMutation = {
  __typename?: "mutation_root";
  update_action_by_pk?: {
    __typename?: "action";
    external_nullifier: string;
  } | null;
};

export const SetExternalNullifierDocument = gql`
  mutation SetExternalNullifier(
    $action_id: String!
    $external_nullifier: String!
  ) {
    update_action_by_pk(
      pk_columns: { id: $action_id }
      _set: { external_nullifier: $external_nullifier }
    ) {
      external_nullifier
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
    SetExternalNullifier(
      variables: SetExternalNullifierMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<SetExternalNullifierMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<SetExternalNullifierMutation>(
            SetExternalNullifierDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "SetExternalNullifier",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
