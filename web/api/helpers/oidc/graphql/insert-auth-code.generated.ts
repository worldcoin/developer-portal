/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type InsertAuthCodeMutationVariables = Types.Exact<{
  auth_code: Types.Scalars["String"]["input"];
  code_challenge?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  code_challenge_method?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  expires_at: Types.Scalars["timestamptz"]["input"];
  nullifier_hash: Types.Scalars["String"]["input"];
  app_id: Types.Scalars["String"]["input"];
  verification_level: Types.Scalars["String"]["input"];
  scope: Types.Scalars["jsonb"]["input"];
  nonce?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  redirect_uri?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type InsertAuthCodeMutation = {
  __typename?: "mutation_root";
  insert_auth_code_one?: {
    __typename?: "auth_code";
    auth_code: string;
    nonce?: string | null;
  } | null;
};

export const InsertAuthCodeDocument = gql`
  mutation InsertAuthCode(
    $auth_code: String!
    $code_challenge: String
    $code_challenge_method: String
    $expires_at: timestamptz!
    $nullifier_hash: String!
    $app_id: String!
    $verification_level: String!
    $scope: jsonb!
    $nonce: String
    $redirect_uri: String
  ) {
    insert_auth_code_one(
      object: {
        auth_code: $auth_code
        code_challenge: $code_challenge
        code_challenge_method: $code_challenge_method
        expires_at: $expires_at
        nullifier_hash: $nullifier_hash
        app_id: $app_id
        verification_level: $verification_level
        scope: $scope
        nonce: $nonce
        redirect_uri: $redirect_uri
      }
    ) {
      auth_code
      nonce
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
    InsertAuthCode(
      variables: InsertAuthCodeMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<InsertAuthCodeMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<InsertAuthCodeMutation>(
            InsertAuthCodeDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "InsertAuthCode",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
