/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchAdminRpsQueryVariables = Types.Exact<{
  includeCreatedAt: Types.Scalars["Boolean"]["input"];
  includeOperationHash: Types.Scalars["Boolean"]["input"];
  includeSignerAddress: Types.Scalars["Boolean"]["input"];
  includeStagingOperationHash: Types.Scalars["Boolean"]["input"];
  includeTeamId: Types.Scalars["Boolean"]["input"];
  limit: Types.Scalars["Int"]["input"];
  offset: Types.Scalars["Int"]["input"];
  orderBy:
    | Array<Types.Rp_Registration_Order_By>
    | Types.Rp_Registration_Order_By;
  where: Types.Rp_Registration_Bool_Exp;
}>;

export type FetchAdminRpsQuery = {
  __typename?: "query_root";
  rp_registration: Array<{
    __typename?: "rp_registration";
    rp_id: string;
    app_id: string;
    mode: unknown;
    status: unknown;
    staging_status?: unknown | null;
    updated_at: string;
    created_at?: string;
    signer_address?: string | null;
    operation_hash?: string | null;
    staging_operation_hash?: string | null;
    app: { __typename?: "app"; id: string; name: string; team_id?: string };
  }>;
  rp_registration_aggregate: {
    __typename?: "rp_registration_aggregate";
    aggregate?: {
      __typename?: "rp_registration_aggregate_fields";
      count: number;
    } | null;
  };
};

export const FetchAdminRpsDocument = gql`
  query FetchAdminRps(
    $includeCreatedAt: Boolean!
    $includeOperationHash: Boolean!
    $includeSignerAddress: Boolean!
    $includeStagingOperationHash: Boolean!
    $includeTeamId: Boolean!
    $limit: Int!
    $offset: Int!
    $orderBy: [rp_registration_order_by!]!
    $where: rp_registration_bool_exp!
  ) {
    rp_registration(
      limit: $limit
      offset: $offset
      order_by: $orderBy
      where: $where
    ) {
      rp_id
      app_id
      mode
      status
      staging_status
      updated_at
      created_at @include(if: $includeCreatedAt)
      signer_address @include(if: $includeSignerAddress)
      operation_hash @include(if: $includeOperationHash)
      staging_operation_hash @include(if: $includeStagingOperationHash)
      app {
        id
        name
        team_id @include(if: $includeTeamId)
      }
    }
    rp_registration_aggregate(where: $where) {
      aggregate {
        count
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
    FetchAdminRps(
      variables: FetchAdminRpsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAdminRpsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAdminRpsQuery>(FetchAdminRpsDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "FetchAdminRps",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
