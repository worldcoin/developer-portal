/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchAdminRpInventoryQueryVariables = Types.Exact<{
  [key: string]: never;
}>;

export type FetchAdminRpInventoryQuery = {
  __typename?: "query_root";
  admin_rp_inventory: Array<{
    __typename?: "admin_rp_inventory";
    total_rps: number;
    managed_rps: number;
    self_managed_rps: number;
    managed_with_key: number;
    managed_without_key: number;
    unique_manager_key_rps: number;
    shared_manager_key_rps: number;
    status_pending: number;
    status_registered: number;
    status_failed: number;
    status_deactivated: number;
    staging_status_pending: number;
    staging_status_registered: number;
    staging_status_failed: number;
    staging_status_deactivated: number;
    staging_status_null: number;
  }>;
};

export const FetchAdminRpInventoryDocument = gql`
  query FetchAdminRpInventory {
    admin_rp_inventory {
      total_rps
      managed_rps
      self_managed_rps
      managed_with_key
      managed_without_key
      unique_manager_key_rps
      shared_manager_key_rps
      status_pending
      status_registered
      status_failed
      status_deactivated
      staging_status_pending
      staging_status_registered
      staging_status_failed
      staging_status_deactivated
      staging_status_null
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
    FetchAdminRpInventory(
      variables?: FetchAdminRpInventoryQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAdminRpInventoryQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAdminRpInventoryQuery>(
            FetchAdminRpInventoryDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchAdminRpInventory",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
