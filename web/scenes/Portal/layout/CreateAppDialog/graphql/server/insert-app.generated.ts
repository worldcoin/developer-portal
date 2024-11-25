/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type InsertAppMutationVariables = Types.Exact<{
  name: Types.Scalars["String"]["input"];
  engine: Types.Scalars["String"]["input"];
  is_staging: Types.Scalars["Boolean"]["input"];
  team_id: Types.Scalars["String"]["input"];
  category: Types.Scalars["String"]["input"];
  integration_url: Types.Scalars["String"]["input"];
  app_mode: Types.Scalars["String"]["input"];
}>;

export type InsertAppMutation = {
  __typename?: "mutation_root";
  insert_app_one?: { __typename?: "app"; id: string } | null;
};

export const InsertAppDocument = gql`
  mutation InsertApp(
    $name: String!
    $engine: String!
    $is_staging: Boolean!
    $team_id: String!
    $category: String!
    $integration_url: String!
    $app_mode: String!
  ) {
    insert_app_one(
      object: {
        engine: $engine
        app_metadata: {
          data: {
            name: $name
            integration_url: $integration_url
            app_mode: $app_mode
            category: $category
          }
        }
        name: $name
        is_staging: $is_staging
        team_id: $team_id
      }
    ) {
      id
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
    InsertApp(
      variables: InsertAppMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<InsertAppMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<InsertAppMutation>(InsertAppDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "InsertApp",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
