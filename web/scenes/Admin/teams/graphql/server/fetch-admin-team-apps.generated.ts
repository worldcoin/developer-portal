/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchAdminTeamAppsQueryVariables = Types.Exact<{
  limit: Types.Scalars["Int"]["input"];
  offset: Types.Scalars["Int"]["input"];
  where: Types.App_Bool_Exp;
}>;

export type FetchAdminTeamAppsQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    id: string;
    name: string;
    created_at: string;
    deleted_at?: string | null;
    draft_metadata: Array<{
      __typename?: "app_metadata";
      name: string;
      verification_status: string;
    }>;
    verified_metadata: Array<{
      __typename?: "app_metadata";
      name: string;
      verified_at?: string | null;
    }>;
  }>;
  app_aggregate: {
    __typename?: "app_aggregate";
    aggregate?: { __typename?: "app_aggregate_fields"; count: number } | null;
  };
};

export const FetchAdminTeamAppsDocument = gql`
  query FetchAdminTeamApps($limit: Int!, $offset: Int!, $where: app_bool_exp!) {
    app(
      limit: $limit
      offset: $offset
      order_by: [{ name: asc }, { id: asc }]
      where: $where
    ) {
      id
      name
      created_at
      deleted_at
      draft_metadata: app_metadata(
        where: { verification_status: { _neq: "verified" } }
        order_by: { updated_at: desc }
        limit: 1
      ) {
        name
        verification_status
      }
      verified_metadata: app_metadata(
        where: { verification_status: { _eq: "verified" } }
        order_by: { verified_at: desc }
        limit: 1
      ) {
        name
        verified_at
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
    FetchAdminTeamApps(
      variables: FetchAdminTeamAppsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAdminTeamAppsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAdminTeamAppsQuery>(
            FetchAdminTeamAppsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchAdminTeamApps",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
