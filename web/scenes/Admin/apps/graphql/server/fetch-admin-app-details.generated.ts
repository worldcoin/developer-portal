import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";

type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];

export type FetchAdminAppDetailsQueryVariables = Types.Exact<{
  appId: Types.Scalars["String"]["input"];
}>;

export type FetchAdminAppDetailsQuery = {
  __typename?: "query_root";
  app_by_pk?: {
    __typename?: "app";
    id: string;
    name: string;
    team_id: string;
    created_at: string;
    deleted_at?: string | null;
    team: {
      __typename?: "team";
      id: string;
      name: string;
      created_at: string;
      deleted_at?: string | null;
    };
    draft_metadata: Array<{
      __typename?: "app_metadata";
      name: string;
      verification_status: string;
      updated_at: string;
    }>;
    verified_metadata: Array<{
      __typename?: "app_metadata";
      name: string;
      verification_status: string;
      verified_at?: string | null;
      updated_at: string;
    }>;
  } | null;
  metadata_versions: Array<{
    __typename?: "app_metadata";
    app_id: string;
    name: string;
    verification_status: string;
    updated_at: string;
    verified_at?: string | null;
  }>;
};

export const FetchAdminAppDetailsDocument = gql`
  query FetchAdminAppDetails($appId: String!) {
    app_by_pk(id: $appId) {
      id
      name
      team_id
      created_at
      deleted_at
      team {
        id
        name
        created_at
        deleted_at
      }
      draft_metadata: app_metadata(
        where: { verification_status: { _neq: "verified" } }
        order_by: { updated_at: desc }
        limit: 1
      ) {
        name
        verification_status
        updated_at
      }
      verified_metadata: app_metadata(
        where: { verification_status: { _eq: "verified" } }
        order_by: { verified_at: desc }
        limit: 1
      ) {
        name
        verification_status
        verified_at
        updated_at
      }
    }
    metadata_versions: app_metadata(
      where: { app_id: { _eq: $appId } }
      order_by: { updated_at: desc }
      limit: 25
    ) {
      app_id
      name
      verification_status
      updated_at
      verified_at
    }
  }
`;

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string,
  variables?: unknown,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (action) => action();

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper,
) {
  return {
    FetchAdminAppDetails(
      variables?: FetchAdminAppDetailsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAdminAppDetailsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAdminAppDetailsQuery>(
            FetchAdminAppDetailsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchAdminAppDetails",
        "query",
        variables,
      );
    },
  };
}

export type Sdk = ReturnType<typeof getSdk>;
