/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetRpRegistrationQueryVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
}>;

export type GetRpRegistrationQuery = {
  __typename?: "query_root";
  rp_registration_by_pk?: {
    __typename?: "rp_registration";
    rp_id: string;
    app_id: string;
    status: unknown;
    mode: unknown;
    signer_address: string;
    created_at: string;
    updated_at: string;
  } | null;
};

export const GetRpRegistrationDocument = gql`
  query GetRpRegistration($rp_id: String!) {
    rp_registration_by_pk(rp_id: $rp_id) {
      rp_id
      app_id
      status
      mode
      signer_address
      created_at
      updated_at
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
