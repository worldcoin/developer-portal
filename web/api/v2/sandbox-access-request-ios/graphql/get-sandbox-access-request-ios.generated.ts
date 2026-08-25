/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetSandboxAccessRequestIosQueryVariables = Types.Exact<{
  user_id: Types.Scalars["String"]["input"];
}>;

export type GetSandboxAccessRequestIosQuery = {
  __typename?: "query_root";
  sandbox_access_request_ios: Array<{
    __typename?: "sandbox_access_request_ios";
    asc_email: string;
    status: "pending" | "approved" | "rejected" | "revoking" | "revoked";
  }>;
};

export const GetSandboxAccessRequestIosDocument = gql`
  query GetSandboxAccessRequestIos($user_id: String!) {
    sandbox_access_request_ios(
      where: { user_id: { _eq: $user_id } }
      limit: 1
    ) {
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
    GetSandboxAccessRequestIos(
      variables: GetSandboxAccessRequestIosQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetSandboxAccessRequestIosQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetSandboxAccessRequestIosQuery>(
            GetSandboxAccessRequestIosDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetSandboxAccessRequestIos",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
