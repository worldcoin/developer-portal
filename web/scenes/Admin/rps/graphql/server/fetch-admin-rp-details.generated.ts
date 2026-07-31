/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchAdminRpDetailsQueryVariables = Types.Exact<{
  rpId: Types.Scalars["String"]["input"];
}>;

export type FetchAdminRpDetailsQuery = {
  __typename?: "query_root";
  rp_registration_by_pk?: {
    __typename?: "rp_registration";
    rp_id: string;
    app_id: string;
    mode: unknown;
    status: unknown;
    staging_status?: unknown | null;
    signer_address?: string | null;
    operation_hash?: string | null;
    staging_operation_hash?: string | null;
    created_at: string;
    updated_at: string;
    app: {
      __typename?: "app";
      id: string;
      name: string;
      created_at: string;
      deleted_at?: string | null;
      team_id: string;
      team: {
        __typename?: "team";
        id: string;
        name?: string | null;
        created_at: string;
        deleted_at?: string | null;
      };
    };
  } | null;
};

export const FetchAdminRpDetailsDocument = gql`
  query FetchAdminRpDetails($rpId: String!) {
    rp_registration_by_pk(rp_id: $rpId) {
      rp_id
      app_id
      mode
      status
      staging_status
      signer_address
      operation_hash
      staging_operation_hash
      created_at
      updated_at
      app {
        id
        name
        created_at
        deleted_at
        team_id
        team {
          id
          name
          created_at
          deleted_at
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
    FetchAdminRpDetails(
      variables: FetchAdminRpDetailsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAdminRpDetailsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAdminRpDetailsQuery>(
            FetchAdminRpDetailsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchAdminRpDetails",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
