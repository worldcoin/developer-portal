/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetExistingRpRegistrationQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
}>;

export type GetExistingRpRegistrationQuery = {
  __typename?: "query_root";
  rp_registration: Array<{
    __typename?: "rp_registration";
    rp_id: string;
    app_id: string;
    mode: string;
    status: string;
  }>;
};

export const GetExistingRpRegistrationDocument = gql`
  query GetExistingRpRegistration($app_id: String!) {
    rp_registration(where: { app_id: { _eq: $app_id } }) {
      rp_id
      app_id
      mode
      status
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
    GetExistingRpRegistration(
      variables: GetExistingRpRegistrationQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetExistingRpRegistrationQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetExistingRpRegistrationQuery>(
            GetExistingRpRegistrationDocument,
            variables,
            {
              ...requestHeaders,
              ...wrappedRequestHeaders,
            },
          ),
        "GetExistingRpRegistration",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
