/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type PrepareRpRegistrationMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  app_id: Types.Scalars["String"]["input"];
  manager_kms_key_id: Types.Scalars["String"]["input"];
  is_unique_manager_key: Types.Scalars["Boolean"]["input"];
}>;

export type PrepareRpRegistrationMutation = {
  __typename?: "mutation_root";
  update_rp_registration?: {
    __typename?: "rp_registration_mutation_response";
    affected_rows: number;
  } | null;
};

export const PrepareRpRegistrationDocument = gql`
  mutation PrepareRpRegistration(
    $rp_id: String!
    $app_id: String!
    $manager_kms_key_id: String!
    $is_unique_manager_key: Boolean!
  ) {
    update_rp_registration(
      where: {
        rp_id: { _eq: $rp_id }
        app_id: { _eq: $app_id }
        mode: { _eq: managed }
        manager_kms_key_id: { _is_null: true }
      }
      _set: {
        manager_kms_key_id: $manager_kms_key_id
        is_unique_manager_key: $is_unique_manager_key
      }
    ) {
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
    PrepareRpRegistration(
      variables: PrepareRpRegistrationMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<PrepareRpRegistrationMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<PrepareRpRegistrationMutation>(
            PrepareRpRegistrationDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "PrepareRpRegistration",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
