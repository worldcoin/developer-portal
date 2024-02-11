/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type FetchAppEnvQueryVariables = Types.Exact<{
  id: Types.Scalars["String"];
}>;

export type FetchAppEnvQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    id: string;
    engine: string;
    is_staging: boolean;
  }>;
};

export const FetchAppEnvDocument = gql`
  query FetchAppEnv($id: String!) {
    app(where: { id: { _eq: $id } }) {
      id
      engine
      is_staging
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
    FetchAppEnv(
      variables: FetchAppEnvQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAppEnvQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAppEnvQuery>(FetchAppEnvDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "FetchAppEnv",
        "query",
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
