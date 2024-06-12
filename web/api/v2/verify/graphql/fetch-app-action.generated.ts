/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type FetchAppActionQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"];
  action: Types.Scalars["String"];
  nullifier_hash: Types.Scalars["String"];
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
      }>;
    }>;
  }>;
};

export const FetchAppActionDocument = gql`
  query FetchAppAction(
    $app_id: String!
    $action: String!
    $nullifier_hash: String!
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
        nullifiers(where: { nullifier_hash: { _eq: $nullifier_hash } }) {
          uses
          created_at
          nullifier_hash
        }
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
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
