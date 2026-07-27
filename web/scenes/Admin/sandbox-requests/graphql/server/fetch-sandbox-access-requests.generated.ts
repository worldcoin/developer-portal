/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchSandboxAccessRequestsQueryVariables = Types.Exact<{
  [key: string]: never;
}>;

export type FetchSandboxAccessRequestsQuery = {
  __typename?: "query_root";
  sandbox_access_request: Array<{
    __typename?: "sandbox_access_request";
    id: string;
    google_email: string;
    user_id: string;
    accepted: boolean;
    created_at: string;
    processed_at?: string | null;
    user: { __typename?: "user"; name: string; email?: string | null };
  }>;
  total: {
    __typename?: "sandbox_access_request_aggregate";
    aggregate?: {
      __typename?: "sandbox_access_request_aggregate_fields";
      count: number;
    } | null;
  };
  pending: {
    __typename?: "sandbox_access_request_aggregate";
    aggregate?: {
      __typename?: "sandbox_access_request_aggregate_fields";
      count: number;
    } | null;
  };
};

export const FetchSandboxAccessRequestsDocument = gql`
  query FetchSandboxAccessRequests {
    sandbox_access_request(order_by: { created_at: desc }) {
      id
      google_email
      user_id
      accepted
      created_at
      processed_at
      user {
        name
        email
      }
    }
    total: sandbox_access_request_aggregate {
      aggregate {
        count
      }
    }
    pending: sandbox_access_request_aggregate(
      where: { accepted: { _eq: false } }
    ) {
      aggregate {
        count
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
    FetchSandboxAccessRequests(
      variables?: FetchSandboxAccessRequestsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchSandboxAccessRequestsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchSandboxAccessRequestsQuery>(
            FetchSandboxAccessRequestsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchSandboxAccessRequests",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
