/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type McpUpsertRpRegistrationMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  app_id: Types.Scalars["String"]["input"];
  mode: Types.Scalars["rp_registration_mode"]["input"];
  signer_address?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type McpUpsertRpRegistrationMutation = {
  __typename?: "mutation_root";
  insert_rp_registration_one?: {
    __typename?: "rp_registration";
    rp_id: string;
    app_id: string;
    mode: unknown;
    signer_address?: string | null;
    status: unknown;
  } | null;
};

export const McpUpsertRpRegistrationDocument = gql`
  mutation McpUpsertRpRegistration(
    $rp_id: String!
    $app_id: String!
    $mode: rp_registration_mode!
    $signer_address: String
  ) {
    insert_rp_registration_one(
      object: {
        rp_id: $rp_id
        app_id: $app_id
        mode: $mode
        signer_address: $signer_address
        status: pending
      }
      on_conflict: {
        constraint: rp_registration_app_id_key
        update_columns: [mode, signer_address, status]
      }
    ) {
      rp_id
      app_id
      mode
      signer_address
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
    McpUpsertRpRegistration(
      variables: McpUpsertRpRegistrationMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<McpUpsertRpRegistrationMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<McpUpsertRpRegistrationMutation>(
            McpUpsertRpRegistrationDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "McpUpsertRpRegistration",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
