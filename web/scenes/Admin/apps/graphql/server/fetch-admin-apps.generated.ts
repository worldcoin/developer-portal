/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchAdminAppsQueryVariables = Types.Exact<{
  includeCreatedAt: Types.Scalars["Boolean"]["input"];
  includeDraftMetadata: Types.Scalars["Boolean"]["input"];
  includeTeamId: Types.Scalars["Boolean"]["input"];
  includeVerifiedMetadata: Types.Scalars["Boolean"]["input"];
  limit: Types.Scalars["Int"]["input"];
  offset: Types.Scalars["Int"]["input"];
  orderBy: Array<Types.App_Order_By> | Types.App_Order_By;
  where: Types.App_Bool_Exp;
}>;

export type FetchAdminAppsQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    id: string;
    name: string;
    team_id?: string;
    created_at?: string;
    draft_metadata?: Array<{ __typename?: "app_metadata"; name: string }>;
    verified_metadata?: Array<{ __typename?: "app_metadata"; name: string }>;
  }>;
  app_aggregate: {
    __typename?: "app_aggregate";
    aggregate?: { __typename?: "app_aggregate_fields"; count: number } | null;
  };
};

export const FetchAdminAppsDocument = gql`
  query FetchAdminApps(
    $includeCreatedAt: Boolean!
    $includeDraftMetadata: Boolean!
    $includeTeamId: Boolean!
    $includeVerifiedMetadata: Boolean!
    $limit: Int!
    $offset: Int!
    $orderBy: [app_order_by!]!
    $where: app_bool_exp!
  ) {
    app(limit: $limit, offset: $offset, order_by: $orderBy, where: $where) {
      id
      name
      team_id @include(if: $includeTeamId)
      created_at @include(if: $includeCreatedAt)
      draft_metadata: app_metadata(
        where: { verification_status: { _neq: "verified" } }
        order_by: { updated_at: desc }
        limit: 1
      ) @include(if: $includeDraftMetadata) {
        name
      }
      verified_metadata: app_metadata(
        where: { verification_status: { _eq: "verified" } }
        order_by: { verified_at: desc }
        limit: 1
      ) @include(if: $includeVerifiedMetadata) {
        name
      }
    }
    app_aggregate(where: $where) {
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
    FetchAdminApps(
      variables: FetchAdminAppsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAdminAppsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAdminAppsQuery>(
            FetchAdminAppsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchAdminApps",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
