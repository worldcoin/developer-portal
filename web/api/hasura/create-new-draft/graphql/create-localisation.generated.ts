/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type CreateLocalisationMutationVariables = Types.Exact<{
  input: Types.Localisations_Insert_Input;
}>;

export type CreateLocalisationMutation = {
  __typename?: "mutation_root";
  insert_localisations_one?: {
    __typename?: "localisations";
    id: string;
  } | null;
};

export const CreateLocalisationDocument = gql`
  mutation CreateLocalisation($input: localisations_insert_input!) {
    insert_localisations_one(object: $input) {
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
    CreateLocalisation(
      variables: CreateLocalisationMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<CreateLocalisationMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CreateLocalisationMutation>(
            CreateLocalisationDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "CreateLocalisation",
        "mutation",
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
