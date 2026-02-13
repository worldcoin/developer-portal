/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type DeleteAuthCodeMutationVariables = Types.Exact<{
  auth_code: Types.Scalars["String"]["input"];
  app_id: Types.Scalars["String"]["input"];
  now: Types.Scalars["timestamptz"]["input"];
}>;

export type DeleteAuthCodeMutation = {
  __typename?: "mutation_root";
  delete_auth_code?: {
    __typename?: "auth_code_mutation_response";
    affected_rows: number;
    returning: Array<{
      __typename?: "auth_code";
      nullifier_hash: string;
      verification_level: string;
      scope?: any | null;
      code_challenge?: string | null;
      code_challenge_method?: string | null;
      redirect_uri: string;
      nonce?: string | null;
    }>;
  } | null;
};

export const DeleteAuthCodeDocument = gql`
  mutation DeleteAuthCode(
    $auth_code: String!
    $app_id: String!
    $now: timestamptz!
  ) {
    delete_auth_code(
      where: {
        app_id: { _eq: $app_id }
        expires_at: { _gt: $now }
        auth_code: { _eq: $auth_code }
      }
    ) {
      returning {
        nullifier_hash
        verification_level
        scope
        code_challenge
        code_challenge_method
        redirect_uri
        nonce
      }
      affected_rows
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
    DeleteAuthCode(
      variables: DeleteAuthCodeMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<DeleteAuthCodeMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<DeleteAuthCodeMutation>(
            DeleteAuthCodeDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "DeleteAuthCode",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
