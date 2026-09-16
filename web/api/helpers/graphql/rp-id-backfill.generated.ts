/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetRpBackfillQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
}>;

export type GetRpBackfillQuery = {
  __typename?: "query_root";
  rp_id_backfill_by_pk?: {
    __typename?: "rp_id_backfill";
    app_id: string;
    rp_id: string;
    production_status: string;
    production_request_id?: string | null;
    staging_status: string;
    staging_request_id?: string | null;
  } | null;
};

export type ClaimProductionBackfillRetryMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  updated_at: Types.Scalars["timestamptz"]["input"];
}>;

export type ClaimProductionBackfillRetryMutation = {
  __typename?: "mutation_root";
  update_rp_registration?: {
    __typename?: "rp_registration_mutation_response";
    affected_rows: number;
  } | null;
};

export type ClaimStagingBackfillRetryMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  updated_at: Types.Scalars["timestamptz"]["input"];
}>;

export type ClaimStagingBackfillRetryMutation = {
  __typename?: "mutation_root";
  update_rp_registration?: {
    __typename?: "rp_registration_mutation_response";
    affected_rows: number;
  } | null;
};

export type PrepareReservedRpRegistrationMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  manager_key: Types.Scalars["String"]["input"];
  staging_status?: Types.InputMaybe<
    Types.Scalars["rp_registration_status"]["input"]
  >;
}>;

export type PrepareReservedRpRegistrationMutation = {
  __typename?: "mutation_root";
  update_rp_registration_by_pk?: {
    __typename?: "rp_registration";
    rp_id: string;
  } | null;
};

export type FinalizeProductionBackfillMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  rp_id: Types.Scalars["String"]["input"];
}>;

export type FinalizeProductionBackfillMutation = {
  __typename?: "mutation_root";
  update_rp_id_backfill?: {
    __typename?: "rp_id_backfill_mutation_response";
    affected_rows: number;
  } | null;
};

export type FinalizeStagingBackfillMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  rp_id: Types.Scalars["String"]["input"];
}>;

export type FinalizeStagingBackfillMutation = {
  __typename?: "mutation_root";
  update_rp_id_backfill?: {
    __typename?: "rp_id_backfill_mutation_response";
    affected_rows: number;
  } | null;
};

export const GetRpBackfillDocument = gql`
  query GetRpBackfill($app_id: String!) {
    rp_id_backfill_by_pk(app_id: $app_id) {
      app_id
      rp_id
      production_status
      production_request_id
      staging_status
      staging_request_id
    }
  }
`;
export const ClaimProductionBackfillRetryDocument = gql`
  mutation ClaimProductionBackfillRetry(
    $rp_id: String!
    $updated_at: timestamptz!
  ) {
    update_rp_registration(
      where: {
        rp_id: { _eq: $rp_id }
        updated_at: { _eq: $updated_at }
        mode: { _eq: managed }
      }
      _set: { status: pending }
    ) {
      affected_rows
    }
  }
`;
export const ClaimStagingBackfillRetryDocument = gql`
  mutation ClaimStagingBackfillRetry(
    $rp_id: String!
    $updated_at: timestamptz!
  ) {
    update_rp_registration(
      where: {
        rp_id: { _eq: $rp_id }
        updated_at: { _eq: $updated_at }
        mode: { _eq: managed }
      }
      _set: { staging_status: pending }
    ) {
      affected_rows
    }
  }
`;
export const PrepareReservedRpRegistrationDocument = gql`
  mutation PrepareReservedRpRegistration(
    $rp_id: String!
    $manager_key: String!
    $staging_status: rp_registration_status
  ) {
    update_rp_registration_by_pk(
      pk_columns: { rp_id: $rp_id }
      _set: {
        manager_kms_key_id: $manager_key
        is_unique_manager_key: false
        staging_status: $staging_status
      }
    ) {
      rp_id
    }
  }
`;
export const FinalizeProductionBackfillDocument = gql`
  mutation FinalizeProductionBackfill($app_id: String!, $rp_id: String!) {
    update_rp_id_backfill(
      where: {
        app_id: { _eq: $app_id }
        rp_id: { _eq: $rp_id }
        production_status: { _in: ["unused", "reserved"] }
      }
      _set: {
        production_status: "already_registered"
        production_request_id: null
      }
    ) {
      affected_rows
    }
  }
`;
export const FinalizeStagingBackfillDocument = gql`
  mutation FinalizeStagingBackfill($app_id: String!, $rp_id: String!) {
    update_rp_id_backfill(
      where: {
        app_id: { _eq: $app_id }
        rp_id: { _eq: $rp_id }
        staging_status: { _in: ["unused", "reserved"] }
      }
      _set: { staging_status: "already_registered", staging_request_id: null }
    ) {
      affected_rows
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
    GetRpBackfill(
      variables: GetRpBackfillQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetRpBackfillQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetRpBackfillQuery>(GetRpBackfillDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "GetRpBackfill",
        "query",
        variables,
      );
    },
    ClaimProductionBackfillRetry(
      variables: ClaimProductionBackfillRetryMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<ClaimProductionBackfillRetryMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<ClaimProductionBackfillRetryMutation>(
            ClaimProductionBackfillRetryDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "ClaimProductionBackfillRetry",
        "mutation",
        variables,
      );
    },
    ClaimStagingBackfillRetry(
      variables: ClaimStagingBackfillRetryMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<ClaimStagingBackfillRetryMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<ClaimStagingBackfillRetryMutation>(
            ClaimStagingBackfillRetryDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "ClaimStagingBackfillRetry",
        "mutation",
        variables,
      );
    },
    PrepareReservedRpRegistration(
      variables: PrepareReservedRpRegistrationMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<PrepareReservedRpRegistrationMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<PrepareReservedRpRegistrationMutation>(
            PrepareReservedRpRegistrationDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "PrepareReservedRpRegistration",
        "mutation",
        variables,
      );
    },
    FinalizeProductionBackfill(
      variables: FinalizeProductionBackfillMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FinalizeProductionBackfillMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FinalizeProductionBackfillMutation>(
            FinalizeProductionBackfillDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FinalizeProductionBackfill",
        "mutation",
        variables,
      );
    },
    FinalizeStagingBackfill(
      variables: FinalizeStagingBackfillMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FinalizeStagingBackfillMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FinalizeStagingBackfillMutation>(
            FinalizeStagingBackfillDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FinalizeStagingBackfill",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
