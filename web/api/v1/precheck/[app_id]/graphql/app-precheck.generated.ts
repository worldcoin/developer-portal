/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type AppPrecheckQueryQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  external_nullifier?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  nullifier_hash?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type AppPrecheckQueryQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    id: string;
    is_staging: boolean;
    engine: string;
    app_metadata: Array<{
      __typename?: "app_metadata";
      name: string;
      integration_url: string;
    }>;
    verified_app_metadata: Array<{
      __typename?: "app_metadata";
      name: string;
      logo_img_url: string;
      integration_url: string;
    }>;
    actions: Array<{
      __typename?: "action";
      external_nullifier: string;
      name: string;
      action: string;
      description: string;
      max_verifications: number;
      max_accounts_per_user: number;
      status: string;
      privacy_policy_uri?: string | null;
      terms_uri?: string | null;
      app_flow_on_complete?: unknown | null;
      webhook_uri?: string | null;
      webhook_pem?: string | null;
      nullifiers: Array<{
        __typename?: "nullifier";
        uses: number;
        nullifier_hash: string;
      }>;
    }>;
  }>;
};

export const AppPrecheckQueryDocument = gql`
  query AppPrecheckQuery(
    $app_id: String!
    $external_nullifier: String
    $nullifier_hash: String
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
      app_metadata(where: { verification_status: { _neq: "verified" } }) {
        name
        integration_url
      }
      verified_app_metadata: app_metadata(
        where: { verification_status: { _eq: "verified" } }
      ) {
        name
        logo_img_url
        integration_url
      }
      actions(where: { external_nullifier: { _eq: $external_nullifier } }) {
        external_nullifier
        name
        action
        description
        max_verifications
        max_accounts_per_user
        status
        privacy_policy_uri
        terms_uri
        app_flow_on_complete
        webhook_uri
        webhook_pem
        nullifiers(where: { nullifier_hash: { _eq: $nullifier_hash } }) {
          uses
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
    AppPrecheckQuery(
      variables: AppPrecheckQueryQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<AppPrecheckQueryQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<AppPrecheckQueryQuery>(
            AppPrecheckQueryDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "AppPrecheckQuery",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
