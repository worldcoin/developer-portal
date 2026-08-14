/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchAdminRpManagerKeyMigrationQueryVariables = Types.Exact<{
  [key: string]: never;
}>;

export type FetchAdminRpManagerKeyMigrationQuery = {
  __typename?: "query_root";
  inventory: Array<{
    __typename?: "admin_rp_manager_key_migration";
    remaining_cron_candidates: number;
    unique_excluded_from_cron: number;
    on_shared_with_audit: number;
    on_shared_without_audit: number;
    unique_with_audit: number;
    audit_pending: number;
    audit_failed: number;
    audit_blocked: number;
    audit_ready_for_external_cleanup: number;
    audit_deletion_scheduled: number;
    audit_deleted: number;
    audit_deletion_overdue: number;
  }>;
  queue: Array<{
    __typename?: "admin_rp_manager_key_migration_queue";
    kind: string;
    rp_id: string;
    app_id: string;
    app_name?: string | null;
    updated_at?: string | null;
    cleanup_status?: string | null;
    last_error_detail?: string | null;
    expected_deletion_at?: string | null;
    total_count: number;
  }>;
};

export const FetchAdminRpManagerKeyMigrationDocument = gql`
  query FetchAdminRpManagerKeyMigration {
    inventory: admin_rp_manager_key_migration {
      remaining_cron_candidates
      unique_excluded_from_cron
      on_shared_with_audit
      on_shared_without_audit
      unique_with_audit
      audit_pending
      audit_failed
      audit_blocked
      audit_ready_for_external_cleanup
      audit_deletion_scheduled
      audit_deleted
      audit_deletion_overdue
    }
    queue: admin_rp_manager_key_migration_queue {
      kind
      rp_id
      app_id
      app_name
      updated_at
      cleanup_status
      last_error_detail
      expected_deletion_at
      total_count
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
    FetchAdminRpManagerKeyMigration(
      variables?: FetchAdminRpManagerKeyMigrationQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAdminRpManagerKeyMigrationQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAdminRpManagerKeyMigrationQuery>(
            FetchAdminRpManagerKeyMigrationDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchAdminRpManagerKeyMigration",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
