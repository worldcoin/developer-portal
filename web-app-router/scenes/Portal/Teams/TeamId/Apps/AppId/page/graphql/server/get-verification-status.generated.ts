/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type GetVerificationStatusQueryVariables = Types.Exact<{
  id: Types.Scalars["String"];
}>;

export type GetVerificationStatusQuery = {
  __typename?: "query_root";
  app_by_pk?: {
    __typename?: "app";
    app_metadata: Array<{
      __typename?: "app_metadata";
      verification_status: string;
    }>;
  } | null;
};

export const GetVerificationStatusDocument = gql`
  query GetVerificationStatus($id: String!) {
    app_by_pk(id: $id) {
      app_metadata {
        verification_status
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
    GetVerificationStatus(
      variables: GetVerificationStatusQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetVerificationStatusQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetVerificationStatusQuery>(
            GetVerificationStatusDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetVerificationStatus",
        "query",
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
