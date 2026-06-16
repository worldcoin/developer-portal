/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetAppStatusByAppIdQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
}>;

export type GetAppStatusByAppIdQuery = {
  __typename?: "query_root";
  app_by_pk?: {
    __typename?: "app";
    status: string;
    is_archived: boolean;
    deleted_at?: string | null;
    verified_app_metadata: Array<{ __typename?: "app_metadata"; id: string }>;
  } | null;
};

export type GetAppStatusByRpIdQueryVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
}>;

export type GetAppStatusByRpIdQuery = {
  __typename?: "query_root";
  rp_registration: Array<{
    __typename?: "rp_registration";
    app: {
      __typename?: "app";
      status: string;
      is_archived: boolean;
      deleted_at?: string | null;
      verified_app_metadata: Array<{ __typename?: "app_metadata"; id: string }>;
    };
  }>;
};

export const GetAppStatusByAppIdDocument = gql`
  query GetAppStatusByAppId($app_id: String!) {
    app_by_pk(id: $app_id) {
      status
      is_archived
      deleted_at
      verified_app_metadata: app_metadata(
        where: { verification_status: { _eq: "verified" } }
        limit: 1
      ) {
        id
      }
    }
  }
`;
export const GetAppStatusByRpIdDocument = gql`
  query GetAppStatusByRpId($rp_id: String!) {
    rp_registration(where: { rp_id: { _eq: $rp_id } }, limit: 1) {
      app {
        status
        is_archived
        deleted_at
        verified_app_metadata: app_metadata(
          where: { verification_status: { _eq: "verified" } }
          limit: 1
        ) {
          id
        }
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
    GetAppStatusByAppId(
      variables: GetAppStatusByAppIdQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetAppStatusByAppIdQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetAppStatusByAppIdQuery>(
            GetAppStatusByAppIdDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetAppStatusByAppId",
        "query",
        variables,
      );
    },
    GetAppStatusByRpId(
      variables: GetAppStatusByRpIdQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetAppStatusByRpIdQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetAppStatusByRpIdQuery>(
            GetAppStatusByRpIdDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetAppStatusByRpId",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
