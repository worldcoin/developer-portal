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
  can_import_all_contacts: Types.Scalars["Boolean"]["input"];
  can_use_attestation: Types.Scalars["Boolean"]["input"];
  is_allowed_unlimited_notifications: Types.Scalars["Boolean"]["input"];
  max_notifications_per_day: Types.Scalars["Int"]["input"];
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
    $can_import_all_contacts: Boolean!
    $can_use_attestation: Boolean!
    $is_allowed_unlimited_notifications: Boolean!
    $max_notifications_per_day: Int!
  ) {
    update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: {
        app_mode: $app_mode
        whitelisted_addresses: $whitelisted_addresses
        associated_domains: $associated_domains
        contracts: $contracts
        permit2_tokens: $permit2_tokens
        can_import_all_contacts: $can_import_all_contacts
        can_use_attestation: $can_use_attestation
        is_allowed_unlimited_notifications: $is_allowed_unlimited_notifications
        max_notifications_per_day: $max_notifications_per_day
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
