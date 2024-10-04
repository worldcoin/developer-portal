/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchAppSecretQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
}>;

export type FetchAppSecretQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    id: string;
    actions: Array<{ __typename?: "action"; client_secret: string }>;
  }>;
};

export const FetchAppSecretDocument = gql`
  query FetchAppSecret($app_id: String!) {
    app(
      where: {
        id: { _eq: $app_id }
        status: { _eq: "active" }
        is_archived: { _eq: false }
        engine: { _eq: "cloud" }
      }
    ) {
      id
      actions(limit: 1, where: { action: { _eq: "" } }) {
        client_secret
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
    FetchAppSecret(
      variables: FetchAppSecretQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAppSecretQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAppSecretQuery>(
            FetchAppSecretDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchAppSecret",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
