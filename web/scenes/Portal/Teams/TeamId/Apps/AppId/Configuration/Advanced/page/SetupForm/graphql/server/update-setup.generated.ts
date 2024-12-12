/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateSetupMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  app_mode: Types.Scalars["String"]["input"];
  whitelisted_addresses?: Types.InputMaybe<
    Array<Types.Scalars["String"]["input"]> | Types.Scalars["String"]["input"]
  >;
  associated_domains?: Types.InputMaybe<
    Array<Types.Scalars["String"]["input"]> | Types.Scalars["String"]["input"]
  >;
  contracts?: Types.InputMaybe<
    Array<Types.Scalars["String"]["input"]> | Types.Scalars["String"]["input"]
  >;
  permit2_tokens?: Types.InputMaybe<
    Array<Types.Scalars["String"]["input"]> | Types.Scalars["String"]["input"]
  >;
}>;

export type UpdateSetupMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
};

export const UpdateSetupDocument = gql`
  mutation UpdateSetup(
    $app_metadata_id: String!
    $app_mode: String!
    $whitelisted_addresses: [String!]
    $associated_domains: [String!]
    $contracts: [String!]
    $permit2_tokens: [String!]
  ) {
    update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: {
        app_mode: $app_mode
        whitelisted_addresses: $whitelisted_addresses
        associated_domains: $associated_domains
        contracts: $contracts
        permit2_tokens: $permit2_tokens
      }
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
    UpdateSetup(
      variables: UpdateSetupMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateSetupMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateSetupMutation>(UpdateSetupDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "UpdateSetup",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
