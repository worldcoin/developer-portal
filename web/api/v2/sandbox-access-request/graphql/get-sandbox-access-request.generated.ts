/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetSandboxAccessRequestQueryVariables = Types.Exact<{
  user_id: Types.Scalars["String"]["input"];
}>;

export type GetSandboxAccessRequestQuery = {
  __typename?: "query_root";
  sandbox_access_request: Array<{
    __typename?: "sandbox_access_request";
    google_email: string;
    accepted: boolean;
    created_at: string;
  }>;
};

export const GetSandboxAccessRequestDocument = gql`
  query GetSandboxAccessRequest($user_id: String!) {
    sandbox_access_request(where: { user_id: { _eq: $user_id } }, limit: 1) {
      google_email
      accepted
      created_at
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
    GetSandboxAccessRequest(
      variables: GetSandboxAccessRequestQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetSandboxAccessRequestQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetSandboxAccessRequestQuery>(
            GetSandboxAccessRequestDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetSandboxAccessRequest",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
