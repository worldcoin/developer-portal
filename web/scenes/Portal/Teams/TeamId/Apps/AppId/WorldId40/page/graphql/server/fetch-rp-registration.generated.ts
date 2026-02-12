/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchRpRegistrationQueryVariables = Types.Exact<{
  appId: Types.Scalars["String"]["input"];
}>;

export type FetchRpRegistrationQuery = {
  __typename?: "query_root";
  rp_registration: Array<{
    __typename?: "rp_registration";
    rp_id: string;
    app_id: string;
    status: unknown;
    mode: unknown;
    signer_address?: string | null;
    created_at: string;
    updated_at: string;
  }>;
};

export const FetchRpRegistrationDocument = gql`
  query FetchRpRegistration($appId: String!) {
    rp_registration(where: { app_id: { _eq: $appId } }) {
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
  };
}
export type Sdk = ReturnType<typeof getSdk>;
