/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type CreateActionV4MutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  action: Types.Scalars["String"]["input"];
  description: Types.Scalars["String"]["input"];
  environment: Types.Scalars["action_environment"]["input"];
}>;

export type CreateActionV4Mutation = {
  __typename?: "mutation_root";
  insert_action_v4_one?: {
    __typename?: "action_v4";
    id: string;
    rp_id: string;
    action: string;
    description: string;
    environment: unknown;
    created_at: string;
  } | null;
};

export const CreateActionV4Document = gql`
  mutation CreateActionV4(
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
        constraint: action_v4_rp_id_action_key
        update_columns: []
      }
    ) {
      id
      rp_id
      action
      description
      environment
      created_at
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
    CreateActionV4(
      variables: CreateActionV4MutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<CreateActionV4Mutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CreateActionV4Mutation>(
            CreateActionV4Document,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "CreateActionV4",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
