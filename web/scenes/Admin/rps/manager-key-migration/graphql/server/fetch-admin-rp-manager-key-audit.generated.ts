/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchAdminRpManagerKeyAuditQueryVariables = Types.Exact<{
  rpId: Types.Scalars["String"]["input"];
}>;

export type FetchAdminRpManagerKeyAuditQuery = {
  __typename?: "query_root";
  rp_registration_by_pk?: {
    __typename?: "rp_registration";
    is_unique_manager_key: boolean;
  } | null;
  rp_manager_key_migration_audit_by_pk?: {
    __typename?: "rp_manager_key_migration_audit";
    rp_id: string;
    app_id: string;
    old_manager_kms_key_id: string;
    old_manager_kms_key_arn: string;
    shared_manager_kms_key_id: string;
    cleanup_status: string;
    last_error_detail?: string | null;
    deletion_scheduled_at?: string | null;
    expected_deletion_at?: string | null;
    created_at: string;
    updated_at: string;
  } | null;
};

export const FetchAdminRpManagerKeyAuditDocument = gql`
  query FetchAdminRpManagerKeyAudit($rpId: String!) {
    rp_registration_by_pk(rp_id: $rpId) {
      is_unique_manager_key
    }
    rp_manager_key_migration_audit_by_pk(rp_id: $rpId) {
      rp_id
      app_id
      old_manager_kms_key_id
      old_manager_kms_key_arn
      shared_manager_kms_key_id
      cleanup_status
      last_error_detail
      deletion_scheduled_at
      expected_deletion_at
      created_at
      updated_at
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
    FetchAdminRpManagerKeyAudit(
      variables: FetchAdminRpManagerKeyAuditQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAdminRpManagerKeyAuditQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAdminRpManagerKeyAuditQuery>(
            FetchAdminRpManagerKeyAuditDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchAdminRpManagerKeyAudit",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
