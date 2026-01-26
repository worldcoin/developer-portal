/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type InsertAppV2MutationVariables = Types.Exact<{
  name: Types.Scalars["String"]["input"];
  engine: Types.Scalars["String"]["input"];
  is_staging: Types.Scalars["Boolean"]["input"];
  team_id: Types.Scalars["String"]["input"];
  category?: Types.Scalars["String"]["input"] | null;
  integration_url: Types.Scalars["String"]["input"];
  app_mode: Types.Scalars["String"]["input"];
}>;

export type InsertAppV2Mutation = {
  __typename?: "mutation_root";
  insert_app_one?: { __typename?: "app"; id: string } | null;
};

export const InsertAppV2Document = gql`
  mutation InsertAppV2(
    $name: String!
    $engine: String!
    $is_staging: Boolean!
    $team_id: String!
    $category: String
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
    InsertAppV2(
      variables: InsertAppV2MutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<InsertAppV2Mutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<InsertAppV2Mutation>(
            InsertAppV2Document,
            variables,
            {
              ...requestHeaders,
              ...wrappedRequestHeaders,
            },
          ),
        "InsertAppV2",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
