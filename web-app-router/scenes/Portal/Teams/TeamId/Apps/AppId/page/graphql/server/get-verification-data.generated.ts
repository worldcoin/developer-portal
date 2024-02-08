/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type FetchAppVerificationDataQueryVariables = Types.Exact<{
  id: Types.Scalars["String"];
}>;

export type FetchAppVerificationDataQuery = {
  __typename?: "query_root";
  app_by_pk?: {
    __typename?: "app";
    app_metadata: Array<{
      __typename?: "app_metadata";
      id: string;
      review_message: string;
      verification_status: string;
    }>;
  } | null;
};

export const FetchAppVerificationDataDocument = gql`
  query FetchAppVerificationData($id: String!) {
    app_by_pk(id: $id) {
      app_metadata(
        where: {
          _or: [
            { verification_status: { _eq: "changes_requested" } }
            { verification_status: { _eq: "verified" } }
          ]
        }
      ) {
        id
        review_message
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
    FetchAppVerificationData(
      variables: FetchAppVerificationDataQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAppVerificationDataQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAppVerificationDataQuery>(
            FetchAppVerificationDataDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchAppVerificationData",
        "query",
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
