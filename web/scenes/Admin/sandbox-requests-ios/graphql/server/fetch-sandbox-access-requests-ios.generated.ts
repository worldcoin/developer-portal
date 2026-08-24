/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchSandboxAccessRequestsIosQueryVariables = Types.Exact<{
  [key: string]: never;
}>;

export type FetchSandboxAccessRequestsIosQuery = {
  __typename?: "query_root";
  sandbox_access_request_ios: Array<{
    __typename?: "sandbox_access_request_ios";
    id: string;
    asc_email: string;
    portal_email: string;
    team_id: string;
    status: "pending" | "approved" | "rejected" | "revoking" | "revoked";
    created_at: string;
    approved_at?: string | null;
    approved_by?: string | null;
    rejection_reason?: string | null;
    revoked_at?: string | null;
    revoked_by?: string | null;
    team: { __typename?: "team"; name?: string | null };
    user: { __typename?: "user"; name: string };
  }>;
  total: {
    __typename?: "sandbox_access_request_ios_aggregate";
    aggregate?: {
      __typename?: "sandbox_access_request_ios_aggregate_fields";
      count: number;
    } | null;
  };
  pending: {
    __typename?: "sandbox_access_request_ios_aggregate";
    aggregate?: {
      __typename?: "sandbox_access_request_ios_aggregate_fields";
      count: number;
    } | null;
  };
};

export const FetchSandboxAccessRequestsIosDocument = gql`
  query FetchSandboxAccessRequestsIos {
    sandbox_access_request_ios(order_by: { created_at: desc }) {
      id
      asc_email
      portal_email
      team_id
      team {
        name
      }
      user {
        name
      }
      status
      created_at
      approved_at
      approved_by
      rejection_reason
      revoked_at
      revoked_by
    }
    total: sandbox_access_request_ios_aggregate {
      aggregate {
        count
      }
    }
    pending: sandbox_access_request_ios_aggregate(
      where: { status: { _eq: pending } }
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
    FetchSandboxAccessRequestsIos(
      variables?: FetchSandboxAccessRequestsIosQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchSandboxAccessRequestsIosQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchSandboxAccessRequestsIosQuery>(
            FetchSandboxAccessRequestsIosDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchSandboxAccessRequestsIos",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
