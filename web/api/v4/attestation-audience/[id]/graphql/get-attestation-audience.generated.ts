/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetAttestationAudienceByAppIdQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
}>;

export type GetAttestationAudienceByAppIdQuery = {
  __typename?: "query_root";
  app_by_pk?: {
    __typename?: "app";
    id: string;
    verified_app_metadata: Array<{ __typename?: "app_metadata"; id: string }>;
    rp_registration: Array<{
      __typename?: "rp_registration";
      rp_id: string;
      status: unknown;
      staging_status?: unknown | null;
    }>;
  } | null;
};

export type GetAttestationAudienceByRpIdQueryVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
}>;

export type GetAttestationAudienceByRpIdQuery = {
  __typename?: "query_root";
  rp_registration: Array<{
    __typename?: "rp_registration";
    app_id: string;
    rp_id: string;
    status: unknown;
    staging_status?: unknown | null;
    app: {
      __typename?: "app";
      verified_app_metadata: Array<{ __typename?: "app_metadata"; id: string }>;
    };
  }>;
};

export const GetAttestationAudienceByAppIdDocument = gql`
  query GetAttestationAudienceByAppId($app_id: String!) {
    app_by_pk(id: $app_id) {
      id
      verified_app_metadata: app_metadata(
        where: { verification_status: { _eq: "verified" } }
        limit: 1
      ) {
        id
      }
      rp_registration(limit: 1) {
        rp_id
        status
        staging_status
      }
    }
  }
`;
export const GetAttestationAudienceByRpIdDocument = gql`
  query GetAttestationAudienceByRpId($rp_id: String!) {
    rp_registration(where: { rp_id: { _eq: $rp_id } }, limit: 1) {
      app_id
      rp_id
      status
      staging_status
      app {
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
    GetAttestationAudienceByAppId(
      variables: GetAttestationAudienceByAppIdQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetAttestationAudienceByAppIdQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetAttestationAudienceByAppIdQuery>(
            GetAttestationAudienceByAppIdDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetAttestationAudienceByAppId",
        "query",
        variables,
      );
    },
    GetAttestationAudienceByRpId(
      variables: GetAttestationAudienceByRpIdQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetAttestationAudienceByRpIdQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetAttestationAudienceByRpIdQuery>(
            GetAttestationAudienceByRpIdDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetAttestationAudienceByRpId",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
