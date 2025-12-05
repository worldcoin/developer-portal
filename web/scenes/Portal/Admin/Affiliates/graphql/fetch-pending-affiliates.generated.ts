/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];

export type FetchPendingAffiliatesQueryVariables = Types.Exact<{
  [key: string]: never;
}>;

export type FetchPendingAffiliatesQuery = {
  __typename?: "query_root";
  teams: Array<{
    __typename?: "team";
    id: string;
    name?: string | null;
    affiliate_status: string;
    created_at: string;
  }>;
};

export const FetchPendingAffiliatesDocument = gql`
  query FetchPendingAffiliates {
    teams: team(
      where: {
        affiliate_status: { _eq: "pending" }
        deleted_at: { _is_null: true }
      }
      order_by: { created_at: desc }
    ) {
      id
      name
      affiliate_status
      created_at
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
    FetchPendingAffiliates(
      variables?: FetchPendingAffiliatesQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchPendingAffiliatesQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchPendingAffiliatesQuery>(
            FetchPendingAffiliatesDocument,
            variables,
            {
              ...requestHeaders,
              ...wrappedRequestHeaders,
            },
          ),
        "FetchPendingAffiliates",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;

