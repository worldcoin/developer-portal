/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type CreateLocalizationMutationVariables = Types.Exact<{
  input: Types.Localisations_Insert_Input;
}>;

export type CreateLocalizationMutation = {
  __typename?: "mutation_root";
  insert_localisations_one?: {
    __typename?: "localisations";
    id: string;
  } | null;
};

export const CreateLocalizationDocument = gql`
  mutation CreateLocalization($input: localisations_insert_input!) {
    insert_localisations_one(object: $input) {
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
    CreateLocalization(
      variables: CreateLocalizationMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<CreateLocalizationMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CreateLocalizationMutation>(
            CreateLocalizationDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "CreateLocalization",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
