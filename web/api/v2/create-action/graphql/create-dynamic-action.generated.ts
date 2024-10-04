/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type CreateDynamicActionMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  external_nullifier: Types.Scalars["String"]["input"];
  action: Types.Scalars["String"]["input"];
  name: Types.Scalars["String"]["input"];
  description: Types.Scalars["String"]["input"];
  max_verifications: Types.Scalars["Int"]["input"];
}>;

export type CreateDynamicActionMutation = {
  __typename?: "mutation_root";
  insert_action_one?: {
    __typename?: "action";
    id: string;
    action: string;
    name: string;
    description: string;
    max_verifications: number;
    external_nullifier: string;
    status: string;
  } | null;
};

export const CreateDynamicActionDocument = gql`
  mutation CreateDynamicAction(
    $app_id: String!
    $external_nullifier: String!
    $action: String!
    $name: String!
    $description: String!
    $max_verifications: Int!
  ) {
    insert_action_one(
      object: {
        app_id: $app_id
        external_nullifier: $external_nullifier
        action: $action
        name: $name
        description: $description
        max_verifications: $max_verifications
        creation_mode: "dynamic"
      }
    ) {
      id
      action
      name
      description
      max_verifications
      external_nullifier
      status
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
    CreateDynamicAction(
      variables: CreateDynamicActionMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<CreateDynamicActionMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CreateDynamicActionMutation>(
            CreateDynamicActionDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "CreateDynamicAction",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
