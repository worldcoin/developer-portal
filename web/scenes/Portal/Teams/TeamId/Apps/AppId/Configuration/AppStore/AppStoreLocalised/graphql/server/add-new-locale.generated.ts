/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type AddLocaleMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  supported_languages?: Types.InputMaybe<
    Array<Types.Scalars["String"]["input"]> | Types.Scalars["String"]["input"]
  >;
}>;

export type AddLocaleMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
};

export const AddLocaleDocument = gql`
  mutation AddLocale(
    $app_metadata_id: String!
    $supported_languages: [String!]
  ) {
    update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: { supported_languages: $supported_languages }
    ) {
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
    AddLocale(
      variables: AddLocaleMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<AddLocaleMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<AddLocaleMutation>(AddLocaleDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "AddLocale",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
