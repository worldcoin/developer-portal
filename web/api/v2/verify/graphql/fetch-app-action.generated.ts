/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchAppActionQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  action: Types.Scalars["String"]["input"];
  nullifier_hash_int: Types.Scalars["String"]["input"];
}>;

export type FetchAppActionQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    id: string;
    is_staging: boolean;
    engine: string;
    actions: Array<{
      __typename?: "action";
      id: string;
      action: string;
      max_verifications: number;
      external_nullifier: string;
      status: string;
      nullifiers: Array<{
        __typename?: "nullifier";
        uses: number;
        created_at: string;
        nullifier_hash: string;
        nullifier_hash_int?: string | null;
      }>;
    }>;
  }>;
};

export const FetchAppActionDocument = gql`
  query FetchAppAction(
    $app_id: String!
    $action: String!
    $nullifier_hash_int: String!
  ) {
    app(
      where: {
        id: { _eq: $app_id }
        status: { _eq: "active" }
        is_archived: { _eq: false }
      }
    ) {
      id
      is_staging
      engine
      actions(where: { action: { _eq: $action } }) {
        id
        action
        max_verifications
        external_nullifier
        status
        nullifiers(
          where: { nullifier_hash_int: { _eq: $nullifier_hash_int } }
        ) {
          uses
          created_at
          nullifier_hash
          nullifier_hash_int
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
    FetchAppAction(
      variables: FetchAppActionQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAppActionQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAppActionQuery>(
            FetchAppActionDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchAppAction",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
