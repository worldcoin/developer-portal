/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetRpRegistrationQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
}>;

export type GetRpRegistrationQuery = {
  __typename?: "query_root";
  rp_registration: Array<{
    __typename?: "rp_registration";
    rp_id: string;
    app_id: string;
    mode: unknown;
    status: unknown;
    signer_address: string;
    manager_kms_key_id?: string | null;
    operation_hash?: string | null;
    app: { __typename?: "app"; team_id: string };
  }>;
};

export const GetRpRegistrationDocument = gql`
  query GetRpRegistration($app_id: String!) {
    rp_registration(where: { app_id: { _eq: $app_id } }) {
      rp_id
      app_id
      mode
      status
      signer_address
      manager_kms_key_id
      operation_hash
      app {
        team_id
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
    GetRpRegistration(
      variables: GetRpRegistrationQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetRpRegistrationQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetRpRegistrationQuery>(
            GetRpRegistrationDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetRpRegistration",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
