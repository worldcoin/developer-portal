/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type ActionsQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"];
}>;

export type ActionsQuery = {
  __typename?: "query_root";
  action: Array<{
    __typename?: "action";
    id: string;
    app_id: string;
    action: string;
    created_at: any;
    creation_mode: string;
    description: string;
    external_nullifier: string;
    kiosk_enabled: boolean;
    name: string;
    max_accounts_per_user: number;
    max_verifications: number;
    updated_at: any;
    nullifiers: Array<{
      __typename?: "nullifier";
      id: string;
      created_at: any;
      nullifier_hash: string;
      uses?: number | null;
    }>;
  }>;
};

export const ActionsDocument = gql`
  query Actions($app_id: String!) {
    action(
      order_by: { created_at: asc }
      where: { app_id: { _eq: $app_id }, action: { _neq: "" } }
    ) {
      id
      app_id
      action
      created_at
      creation_mode
      description
      external_nullifier
      kiosk_enabled
      name
      max_accounts_per_user
      max_verifications
      updated_at
      nullifiers {
        id
        created_at
        nullifier_hash
        uses
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
    Actions(
      variables: ActionsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<ActionsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<ActionsQuery>(ActionsDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "Actions",
        "query",
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
