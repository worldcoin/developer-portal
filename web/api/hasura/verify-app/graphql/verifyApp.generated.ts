/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type VerifyAppMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  id_to_verify: Types.Scalars["String"]["input"];
  operation_id: Types.Scalars["uuid"]["input"];
  expected_metadata_updated_at: Types.Scalars["timestamptz"]["input"];
  expected_prior_verified_id?: Types.InputMaybe<
    Types.Scalars["String"]["input"]
  >;
  expected_prior_verified_updated_at?: Types.InputMaybe<
    Types.Scalars["timestamptz"]["input"]
  >;
  expected_localization_versions: Types.Scalars["jsonb"]["input"];
  reviewer_name: Types.Scalars["String"]["input"];
  is_reviewer_app_store_approved: Types.Scalars["Boolean"]["input"];
  is_reviewer_world_app_approved: Types.Scalars["Boolean"]["input"];
  metadata_assets: Types.Scalars["jsonb"]["input"];
  localization_assets: Types.Scalars["jsonb"]["input"];
}>;

export type VerifyAppMutation = {
  __typename?: "mutation_root";
  legacy_verify_app_metadata: Array<{
    __typename?: "app_metadata";
    id: string;
  }>;
};

export const VerifyAppDocument = gql`
  mutation verifyApp(
    $app_id: String!
    $id_to_verify: String!
    $operation_id: uuid!
    $expected_metadata_updated_at: timestamptz!
    $expected_prior_verified_id: String
    $expected_prior_verified_updated_at: timestamptz
    $expected_localization_versions: jsonb!
    $reviewer_name: String!
    $is_reviewer_app_store_approved: Boolean!
    $is_reviewer_world_app_approved: Boolean!
    $metadata_assets: jsonb!
    $localization_assets: jsonb!
  ) {
    legacy_verify_app_metadata(
      args: {
        p_app_id: $app_id
        p_app_metadata_id: $id_to_verify
        p_operation_id: $operation_id
        p_expected_metadata_updated_at: $expected_metadata_updated_at
        p_expected_prior_verified_id: $expected_prior_verified_id
        p_expected_prior_verified_updated_at: $expected_prior_verified_updated_at
        p_expected_localization_versions: $expected_localization_versions
        p_reviewer_name: $reviewer_name
        p_is_reviewer_app_store_approved: $is_reviewer_app_store_approved
        p_is_reviewer_world_app_approved: $is_reviewer_world_app_approved
        p_metadata_assets: $metadata_assets
        p_localization_assets: $localization_assets
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
    verifyApp(
      variables: VerifyAppMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<VerifyAppMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<VerifyAppMutation>(VerifyAppDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "verifyApp",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
