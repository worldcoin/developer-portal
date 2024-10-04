/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type SignInActionQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
}>;

export type SignInActionQuery = {
  __typename?: "query_root";
  action: Array<{
    __typename?: "action";
    id: string;
    app_id: string;
    status: string;
    privacy_policy_uri?: string | null;
    terms_uri?: string | null;
  }>;
};

export const SignInActionDocument = gql`
  query SignInAction($app_id: String!) {
    action(where: { app_id: { _eq: $app_id }, action: { _eq: "" } }) {
      id
      app_id
      status
      privacy_policy_uri
      terms_uri
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
    SignInAction(
      variables: SignInActionQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<SignInActionQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<SignInActionQuery>(SignInActionDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "SignInAction",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
