/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type SignInActionQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"];
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
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
