/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type InsertActionMutationVariables = Types.Exact<{
  name: Types.Scalars["String"]["input"];
  description?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  action?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  app_id: Types.Scalars["String"]["input"];
  external_nullifier: Types.Scalars["String"]["input"];
  max_verifications?: Types.InputMaybe<Types.Scalars["Int"]["input"]>;
  app_flow_on_complete: Types.Scalars["app_flow_on_complete_enum"]["input"];
  webhook_uri?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  webhook_pem?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  post_action_deep_link_ios?: Types.InputMaybe<
    Types.Scalars["String"]["input"]
  >;
  post_action_deep_link_android?: Types.InputMaybe<
    Types.Scalars["String"]["input"]
  >;
}>;

export type InsertActionMutation = {
  __typename?: "mutation_root";
  insert_action_one?: { __typename?: "action"; id: string } | null;
};

export const InsertActionDocument = gql`
  mutation InsertAction(
    $name: String!
    $description: String = ""
    $action: String = ""
    $app_id: String!
    $external_nullifier: String!
    $max_verifications: Int = 1
    $app_flow_on_complete: app_flow_on_complete_enum!
    $webhook_uri: String
    $webhook_pem: String
    $post_action_deep_link_ios: String
    $post_action_deep_link_android: String
  ) {
    insert_action_one(
      object: {
        action: $action
        app_id: $app_id
        name: $name
        description: $description
        external_nullifier: $external_nullifier
        max_verifications: $max_verifications
        app_flow_on_complete: $app_flow_on_complete
        webhook_uri: $webhook_uri
        webhook_pem: $webhook_pem
        post_action_deep_link_ios: $post_action_deep_link_ios
        post_action_deep_link_android: $post_action_deep_link_android
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
    InsertAction(
      variables: InsertActionMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<InsertActionMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<InsertActionMutation>(
            InsertActionDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "InsertAction",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
