/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type VerifyFetchApiKeyQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
  appId: Types.Scalars["String"]["input"];
}>;

export type VerifyFetchApiKeyQuery = {
  __typename?: "query_root";
  api_key_by_pk?: {
    __typename?: "api_key";
    id: string;
    api_key: string;
    is_active: boolean;
    team: {
      __typename?: "team";
      id: string;
      apps: Array<{ __typename?: "app"; id: string }>;
    };
  } | null;
};

export const VerifyFetchApiKeyDocument = gql`
  query VerifyFetchAPIKey($id: String!, $appId: String!) {
    api_key_by_pk(id: $id) {
      id
      api_key
      is_active
      team {
        id
        apps(where: { id: { _eq: $appId } }) {
          id
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
    VerifyFetchAPIKey(
      variables: VerifyFetchApiKeyQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<VerifyFetchApiKeyQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<VerifyFetchApiKeyQuery>(
            VerifyFetchApiKeyDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "VerifyFetchAPIKey",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
