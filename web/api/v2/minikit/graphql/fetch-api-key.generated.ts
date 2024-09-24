/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type FetchApiKeyQueryVariables = Types.Exact<{
  id: Types.Scalars["String"];
  appId: Types.Scalars["String"];
}>;

export type FetchApiKeyQuery = {
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

export const FetchApiKeyDocument = gql`
  query FetchAPIKey($id: String!, $appId: String!) {
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
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType,
) => action();

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper,
) {
  return {
    FetchAPIKey(
      variables: FetchApiKeyQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchApiKeyQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchApiKeyQuery>(FetchApiKeyDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "FetchAPIKey",
        "query",
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
