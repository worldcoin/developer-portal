/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchRpRegistrationForPrecheckQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
}>;

export type FetchRpRegistrationForPrecheckQuery = {
  __typename?: "query_root";
  rp_registration: Array<{
    __typename?: "rp_registration";
    rp_id: string;
    app_id: string;
    status: unknown;
  }>;
};

export const FetchRpRegistrationForPrecheckDocument = gql`
  query FetchRpRegistrationForPrecheck($app_id: String!) {
    rp_registration(where: { app_id: { _eq: $app_id } }) {
      rp_id
      app_id
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
    FetchRpRegistrationForPrecheck(
      variables: FetchRpRegistrationForPrecheckQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchRpRegistrationForPrecheckQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchRpRegistrationForPrecheckQuery>(
            FetchRpRegistrationForPrecheckDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchRpRegistrationForPrecheck",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
