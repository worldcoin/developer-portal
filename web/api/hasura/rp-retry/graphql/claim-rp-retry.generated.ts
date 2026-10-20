/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type ClaimProductionRpRetryMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  manager_key: Types.Scalars["String"]["input"];
  signer: Types.Scalars["String"]["input"];
}>;

export type ClaimProductionRpRetryMutation = {
  __typename?: "mutation_root";
  update_rp_registration?: {
    __typename?: "rp_registration_mutation_response";
    affected_rows: number;
    returning: Array<{ __typename?: "rp_registration"; updated_at: string }>;
  } | null;
};

export type ClaimStagingRpRetryMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  manager_key: Types.Scalars["String"]["input"];
  signer: Types.Scalars["String"]["input"];
}>;

export type ClaimStagingRpRetryMutation = {
  __typename?: "mutation_root";
  update_rp_registration?: {
    __typename?: "rp_registration_mutation_response";
    affected_rows: number;
    returning: Array<{ __typename?: "rp_registration"; updated_at: string }>;
  } | null;
};

export const ClaimProductionRpRetryDocument = gql`
  mutation ClaimProductionRpRetry(
    $rp_id: String!
    $manager_key: String!
    $signer: String!
  ) {
    update_rp_registration(
      where: {
        rp_id: { _eq: $rp_id }
        mode: { _eq: managed }
        status: { _eq: failed }
        manager_kms_key_id: { _eq: $manager_key }
        signer_address: { _eq: $signer }
      }
      _set: { status: pending }
    ) {
      affected_rows
      returning {
        updated_at
      }
    }
  }
`;
export const ClaimStagingRpRetryDocument = gql`
  mutation ClaimStagingRpRetry(
    $rp_id: String!
    $manager_key: String!
    $signer: String!
  ) {
    update_rp_registration(
      where: {
        rp_id: { _eq: $rp_id }
        mode: { _eq: managed }
        staging_status: { _eq: failed }
        manager_kms_key_id: { _eq: $manager_key }
        signer_address: { _eq: $signer }
      }
      _set: { staging_status: pending }
    ) {
      affected_rows
      returning {
        updated_at
      }
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
    ClaimProductionRpRetry(
      variables: ClaimProductionRpRetryMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<ClaimProductionRpRetryMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<ClaimProductionRpRetryMutation>(
            ClaimProductionRpRetryDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "ClaimProductionRpRetry",
        "mutation",
        variables,
      );
    },
    ClaimStagingRpRetry(
      variables: ClaimStagingRpRetryMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<ClaimStagingRpRetryMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<ClaimStagingRpRetryMutation>(
            ClaimStagingRpRetryDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "ClaimStagingRpRetry",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
