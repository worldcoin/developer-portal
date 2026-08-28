/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type RegisterLegacyVerificationAssetSettlementMutationVariables =
  Types.Exact<{
    operation_id: Types.Scalars["uuid"]["input"];
    app_id: Types.Scalars["String"]["input"];
    app_metadata_id: Types.Scalars["String"]["input"];
    expected_metadata_updated_at: Types.Scalars["timestamptz"]["input"];
    prepared_asset_keys: Types.Scalars["jsonb"]["input"];
    prior_asset_keys: Types.Scalars["jsonb"]["input"];
  }>;

export type RegisterLegacyVerificationAssetSettlementMutation = {
  __typename?: "mutation_root";
  register_legacy_app_verification_asset_settlement: Array<{
    __typename?: "legacy_app_verification_asset_settlement";
    operation_id: unknown;
    outcome: string;
    delivery_status: string;
  }>;
};

export type ClaimLegacyVerificationAssetSettlementsMutationVariables =
  Types.Exact<{
    worker_id: Types.Scalars["String"]["input"];
    limit: Types.Scalars["Int"]["input"];
  }>;

export type ClaimLegacyVerificationAssetSettlementsMutation = {
  __typename?: "mutation_root";
  reviewer_claim_legacy_app_verification_asset_settlements: Array<{
    __typename?: "legacy_app_verification_asset_settlement";
    operation_id: unknown;
    app_id: string;
    app_metadata_id: string;
    prepared_asset_keys: Array<string>;
    prior_asset_keys: Array<string>;
    outcome: string;
    delivery_status: string;
    attempt_count: number;
    locked_by?: string | null;
  }>;
};

export type CompleteLegacyVerificationAssetSettlementMutationVariables =
  Types.Exact<{
    operation_id: Types.Scalars["uuid"]["input"];
    worker_id?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
    expected_outcome: Types.Scalars["String"]["input"];
    delivery_succeeded: Types.Scalars["Boolean"]["input"];
    error?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  }>;

export type CompleteLegacyVerificationAssetSettlementMutation = {
  __typename?: "mutation_root";
  complete_legacy_app_verification_asset_settlement: Array<{
    __typename?: "legacy_app_verification_asset_settlement";
    operation_id: unknown;
    outcome: string;
    delivery_status: string;
    attempt_count: number;
    next_attempt_at: string;
    delivered_at?: string | null;
  }>;
};

export const RegisterLegacyVerificationAssetSettlementDocument = gql`
  mutation RegisterLegacyVerificationAssetSettlement(
    $operation_id: uuid!
    $app_id: String!
    $app_metadata_id: String!
    $expected_metadata_updated_at: timestamptz!
    $prepared_asset_keys: jsonb!
    $prior_asset_keys: jsonb!
  ) {
    register_legacy_app_verification_asset_settlement(
      args: {
        p_operation_id: $operation_id
        p_app_id: $app_id
        p_app_metadata_id: $app_metadata_id
        p_expected_metadata_updated_at: $expected_metadata_updated_at
        p_prepared_asset_keys: $prepared_asset_keys
        p_prior_asset_keys: $prior_asset_keys
      }
    ) {
      operation_id
      outcome
      delivery_status
    }
  }
`;
export const ClaimLegacyVerificationAssetSettlementsDocument = gql`
  mutation ClaimLegacyVerificationAssetSettlements(
    $worker_id: String!
    $limit: Int!
  ) {
    reviewer_claim_legacy_app_verification_asset_settlements(
      args: { p_worker_id: $worker_id, p_limit: $limit }
    ) {
      operation_id
      app_id
      app_metadata_id
      prepared_asset_keys
      prior_asset_keys
      outcome
      delivery_status
      attempt_count
      locked_by
    }
  }
`;
export const CompleteLegacyVerificationAssetSettlementDocument = gql`
  mutation CompleteLegacyVerificationAssetSettlement(
    $operation_id: uuid!
    $worker_id: String
    $expected_outcome: String!
    $delivery_succeeded: Boolean!
    $error: String
  ) {
    complete_legacy_app_verification_asset_settlement(
      args: {
        p_operation_id: $operation_id
        p_worker_id: $worker_id
        p_expected_outcome: $expected_outcome
        p_delivery_succeeded: $delivery_succeeded
        p_error: $error
      }
    ) {
      operation_id
      outcome
      delivery_status
      attempt_count
      next_attempt_at
      delivered_at
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
    RegisterLegacyVerificationAssetSettlement(
      variables: RegisterLegacyVerificationAssetSettlementMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<RegisterLegacyVerificationAssetSettlementMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<RegisterLegacyVerificationAssetSettlementMutation>(
            RegisterLegacyVerificationAssetSettlementDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "RegisterLegacyVerificationAssetSettlement",
        "mutation",
        variables,
      );
    },
    ClaimLegacyVerificationAssetSettlements(
      variables: ClaimLegacyVerificationAssetSettlementsMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<ClaimLegacyVerificationAssetSettlementsMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<ClaimLegacyVerificationAssetSettlementsMutation>(
            ClaimLegacyVerificationAssetSettlementsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "ClaimLegacyVerificationAssetSettlements",
        "mutation",
        variables,
      );
    },
    CompleteLegacyVerificationAssetSettlement(
      variables: CompleteLegacyVerificationAssetSettlementMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<CompleteLegacyVerificationAssetSettlementMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CompleteLegacyVerificationAssetSettlementMutation>(
            CompleteLegacyVerificationAssetSettlementDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "CompleteLegacyVerificationAssetSettlement",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
