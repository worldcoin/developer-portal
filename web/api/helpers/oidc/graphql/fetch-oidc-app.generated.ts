/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchOidcAppQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  redirect_uri: Types.Scalars["String"]["input"];
}>;

export type FetchOidcAppQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    id: string;
    is_staging: boolean;
    actions: Array<{
      __typename?: "action";
      id: string;
      external_nullifier: string;
      status: string;
      redirects: Array<{ __typename?: "redirect"; redirect_uri: string }>;
    }>;
  }>;
};

export const FetchOidcAppDocument = gql`
  query FetchOIDCApp($app_id: String!, $redirect_uri: String!) {
    app(
      where: {
        id: { _eq: $app_id }
        status: { _eq: "active" }
        is_archived: { _eq: false }
        engine: { _eq: "cloud" }
      }
    ) {
      id
      is_staging
      actions(where: { action: { _eq: "" } }) {
        id
        external_nullifier
        status
        redirects(where: { redirect_uri: { _eq: $redirect_uri } }) {
          redirect_uri
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
    FetchOIDCApp(
      variables: FetchOidcAppQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchOidcAppQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchOidcAppQuery>(FetchOidcAppDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "FetchOIDCApp",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
