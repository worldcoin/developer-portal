/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type FetchAppSecretQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"];
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
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
