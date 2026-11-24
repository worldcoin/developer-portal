/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetSandboxRequestIosForProcessingQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type GetSandboxRequestIosForProcessingQuery = {
  __typename?: "query_root";
  sandbox_access_request_ios_by_pk?: {
    __typename?: "sandbox_access_request_ios";
    asc_email: string;
    status:
      | "pending"
      | "approving"
      | "approved"
      | "rejected"
      | "revoking"
      | "revoked";
  } | null;
};

export const GetSandboxRequestIosForProcessingDocument = gql`
  query GetSandboxRequestIosForProcessing($id: String!) {
    sandbox_access_request_ios_by_pk(id: $id) {
      asc_email
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
    GetSandboxRequestIosForProcessing(
      variables: GetSandboxRequestIosForProcessingQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetSandboxRequestIosForProcessingQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetSandboxRequestIosForProcessingQuery>(
            GetSandboxRequestIosForProcessingDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetSandboxRequestIosForProcessing",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
