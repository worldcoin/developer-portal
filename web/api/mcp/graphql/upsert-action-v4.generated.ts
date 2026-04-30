/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type McpUpsertActionV4MutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  action: Types.Scalars["String"]["input"];
  description: Types.Scalars["String"]["input"];
  environment: Types.Scalars["action_environment"]["input"];
}>;

export type McpUpsertActionV4Mutation = {
  __typename?: "mutation_root";
  insert_action_v4_one?: {
    __typename?: "action_v4";
    id: string;
    rp_id: string;
    action: string;
    description: string;
    environment: unknown;
  } | null;
};

export const McpUpsertActionV4Document = gql`
  mutation McpUpsertActionV4(
    $rp_id: String!
    $action: String!
    $description: String!
    $environment: action_environment!
  ) {
    insert_action_v4_one(
      object: {
        rp_id: $rp_id
        action: $action
        description: $description
        environment: $environment
      }
      on_conflict: {
        constraint: action_v4_rp_id_action_environment_key
        update_columns: [description]
      }
    ) {
      id
      rp_id
      action
      description
      environment
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
    McpUpsertActionV4(
      variables: McpUpsertActionV4MutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<McpUpsertActionV4Mutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<McpUpsertActionV4Mutation>(
            McpUpsertActionV4Document,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "McpUpsertActionV4",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
