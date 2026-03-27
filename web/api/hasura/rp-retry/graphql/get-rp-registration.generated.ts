/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetRpRegistrationForRetryQueryVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
}>;

export type GetRpRegistrationForRetryQuery = {
  __typename?: "query_root";
  rp_registration_by_pk?: {
    __typename?: "rp_registration";
    rp_id: string;
    app_id: string;
    status: unknown;
    mode: unknown;
    signer_address?: string | null;
    manager_kms_key_id?: string | null;
    app: {
      __typename?: "app";
      id: string;
      team_id: string;
      app_metadata: Array<{ __typename?: "app_metadata"; name: string }>;
    };
  } | null;
};

export const GetRpRegistrationForRetryDocument = gql`
  query GetRpRegistrationForRetry($rp_id: String!) {
    rp_registration_by_pk(rp_id: $rp_id) {
      rp_id
      app_id
      status
      mode
      signer_address
      manager_kms_key_id
      app {
        id
        team_id
        app_metadata(limit: 1) {
          name
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
    GetRpRegistrationForRetry(
      variables: GetRpRegistrationForRetryQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetRpRegistrationForRetryQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetRpRegistrationForRetryQuery>(
            GetRpRegistrationForRetryDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetRpRegistrationForRetry",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
