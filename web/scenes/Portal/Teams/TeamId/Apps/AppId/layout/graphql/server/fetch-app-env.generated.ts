/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchAppEnvQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type FetchAppEnvQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    id: string;
    engine: string;
    app_metadata: Array<{ __typename?: "app_metadata"; app_mode: string }>;
    verified_app_metadata: Array<{
      __typename?: "app_metadata";
      app_mode: string;
    }>;
    rp_registration: Array<{ __typename?: "rp_registration"; rp_id: string }>;
  }>;
  action: Array<{ __typename?: "action"; id: string }>;
};

export const FetchAppEnvDocument = gql`
  query FetchAppEnv($id: String!) {
    app(where: { id: { _eq: $id } }) {
      id
      engine
      app_metadata(
        where: { verification_status: { _neq: "verified" } }
        limit: 1
      ) {
        app_mode
      }
      verified_app_metadata: app_metadata(
        where: { verification_status: { _eq: "verified" } }
        limit: 1
      ) {
        app_mode
      }
      rp_registration {
        rp_id
      }
    }
    action(where: { app_id: { _eq: $id }, action: { _neq: "" } }, limit: 1) {
      id
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
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
