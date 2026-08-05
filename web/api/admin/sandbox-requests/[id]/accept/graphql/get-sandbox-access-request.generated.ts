/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetSandboxAccessRequestQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type GetSandboxAccessRequestQuery = {
  __typename?: "query_root";
  sandbox_access_request: Array<{
    __typename?: "sandbox_access_request";
    id: string;
    google_email: string;
    accepted: boolean;
  }>;
};

export const GetSandboxAccessRequestDocument = gql`
  query GetSandboxAccessRequest($id: String!) {
    sandbox_access_request(where: { id: { _eq: $id } }, limit: 1) {
      id
      google_email
      accepted
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
