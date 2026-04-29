/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type McpCreateAppMutationVariables = Types.Exact<{
  team_id: Types.Scalars["String"]["input"];
  name: Types.Scalars["String"]["input"];
  engine: Types.Scalars["String"]["input"];
  is_staging: Types.Scalars["Boolean"]["input"];
  category: Types.Scalars["String"]["input"];
  integration_url: Types.Scalars["String"]["input"];
  app_mode: Types.Scalars["String"]["input"];
}>;

export type McpCreateAppMutation = {
  __typename?: "mutation_root";
  insert_app_one?: {
    __typename?: "app";
    id: string;
    name: string;
    is_staging: boolean;
    engine: string;
    app_metadata: Array<{
      __typename?: "app_metadata";
      id: string;
      app_mode: string;
      category: string;
      integration_url: string;
    }>;
  } | null;
};

export const McpCreateAppDocument = gql`
  mutation McpCreateApp(
    $team_id: String!
    $name: String!
    $engine: String!
    $is_staging: Boolean!
    $category: String!
    $integration_url: String!
    $app_mode: String!
  ) {
    insert_app_one(
      object: {
        engine: $engine
        name: $name
        is_staging: $is_staging
        team_id: $team_id
        app_metadata: {
          data: {
            name: $name
            integration_url: $integration_url
            app_mode: $app_mode
            category: $category
          }
        }
      }
    ) {
      id
      name
      is_staging
      engine
      app_metadata(order_by: { created_at: desc }, limit: 1) {
        id
        app_mode
        category
        integration_url
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
    McpCreateApp(
      variables: McpCreateAppMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<McpCreateAppMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<McpCreateAppMutation>(
            McpCreateAppDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "McpCreateApp",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
