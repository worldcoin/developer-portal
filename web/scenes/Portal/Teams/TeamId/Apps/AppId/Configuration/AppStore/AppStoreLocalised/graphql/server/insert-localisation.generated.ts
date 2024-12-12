/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type InsertLocalisationMutationVariables = Types.Exact<{
  input: Types.Localisations_Insert_Input;
}>;

export type InsertLocalisationMutation = {
  __typename?: "mutation_root";
  insert_localisations_one?: {
    __typename?: "localisations";
    id: string;
  } | null;
};

export const InsertLocalisationDocument = gql`
  mutation InsertLocalisation($input: localisations_insert_input!) {
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
    InsertLocalisation(
      variables: InsertLocalisationMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<InsertLocalisationMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<InsertLocalisationMutation>(
            InsertLocalisationDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "InsertLocalisation",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
