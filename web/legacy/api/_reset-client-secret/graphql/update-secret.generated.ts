/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type UpdateSecretMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"];
  hashed_secret: Types.Scalars["String"];
}>;

export type UpdateSecretMutation = {
  __typename?: "mutation_root";
  update_action?: {
    __typename?: "action_mutation_response";
    affected_rows: number;
  } | null;
};

export const UpdateSecretDocument = gql`
  mutation UpdateSecret($app_id: String!, $hashed_secret: String!) {
    update_action(
      where: { app_id: { _eq: $app_id }, action: { _eq: "" } }
      _set: { client_secret: $hashed_secret }
    ) {
      affected_rows
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
    UpdateSecret(
      variables: UpdateSecretMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateSecretMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateSecretMutation>(
            UpdateSecretDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "UpdateSecret",
        "mutation",
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
