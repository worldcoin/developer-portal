/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type McpSetStagingVerificationWindowMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  expires_at?: Types.InputMaybe<Types.Scalars["timestamptz"]["input"]>;
  token_hash?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type McpSetStagingVerificationWindowMutation = {
  __typename?: "mutation_root";
  update_rp_registration_by_pk?: {
    __typename?: "rp_registration";
    rp_id: string;
    staging_verification_expires_at?: string | null;
  } | null;
};

export const McpSetStagingVerificationWindowDocument = gql`
  mutation McpSetStagingVerificationWindow(
    $rp_id: String!
    $expires_at: timestamptz
    $token_hash: String
  ) {
    update_rp_registration_by_pk(
      pk_columns: { rp_id: $rp_id }
      _set: {
        staging_verification_expires_at: $expires_at
        staging_verification_token_hash: $token_hash
      }
    ) {
      rp_id
      staging_verification_expires_at
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
    McpSetStagingVerificationWindow(
      variables: McpSetStagingVerificationWindowMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<McpSetStagingVerificationWindowMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<McpSetStagingVerificationWindowMutation>(
            McpSetStagingVerificationWindowDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "McpSetStagingVerificationWindow",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
