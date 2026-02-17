/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchRpRegistrationQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
}>;

export type FetchRpRegistrationQuery = {
  __typename?: "query_root";
  rp_registration: Array<{
    __typename?: "rp_registration";
    rp_id: string;
    app_id: string;
    mode: unknown;
    signer_address?: string | null;
    status: unknown;
    app: {
      __typename?: "app";
      id: string;
      status: string;
      is_archived: boolean;
      deleted_at?: string | null;
      app_metadata: Array<{ __typename?: "app_metadata"; app_mode: string }>;
    };
  }>;
};

export type FetchRpRegistrationByRpIdQueryVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
}>;

export type FetchRpRegistrationByRpIdQuery = {
  __typename?: "query_root";
  rp_registration: Array<{
    __typename?: "rp_registration";
    rp_id: string;
    app_id: string;
    mode: unknown;
    signer_address?: string | null;
    status: unknown;
    app: {
      __typename?: "app";
      id: string;
      status: string;
      is_archived: boolean;
      deleted_at?: string | null;
      app_metadata: Array<{ __typename?: "app_metadata"; app_mode: string }>;
    };
  }>;
};

export const FetchRpRegistrationDocument = gql`
  query FetchRpRegistration($app_id: String!) {
    rp_registration(where: { app_id: { _eq: $app_id } }) {
      rp_id
      app_id
      mode
      signer_address
      status
      app {
        id
        status
        is_archived
        deleted_at
        app_metadata {
          app_mode
        }
      }
    }
  }
`;
export const FetchRpRegistrationByRpIdDocument = gql`
  query FetchRpRegistrationByRpId($rp_id: String!) {
    rp_registration(where: { rp_id: { _eq: $rp_id } }) {
      rp_id
      app_id
      mode
      signer_address
      status
      app {
        id
        status
        is_archived
        deleted_at
        app_metadata {
          app_mode
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
    FetchRpRegistration(
      variables: FetchRpRegistrationQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchRpRegistrationQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchRpRegistrationQuery>(
            FetchRpRegistrationDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchRpRegistration",
        "query",
        variables,
      );
    },
    FetchRpRegistrationByRpId(
      variables: FetchRpRegistrationByRpIdQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchRpRegistrationByRpIdQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchRpRegistrationByRpIdQuery>(
            FetchRpRegistrationByRpIdDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchRpRegistrationByRpId",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
