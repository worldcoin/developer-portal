/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type PrepareRpRegistrationMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  manager_kms_key_id: Types.Scalars["String"]["input"];
  is_unique_manager_key: Types.Scalars["Boolean"]["input"];
}>;

export type PrepareRpRegistrationMutation = {
  __typename?: "mutation_root";
  update_rp_registration_by_pk?: {
    __typename?: "rp_registration";
    rp_id: string;
    manager_kms_key_id?: string | null;
    is_unique_manager_key: boolean;
  } | null;
};

export const PrepareRpRegistrationDocument = gql`
  mutation PrepareRpRegistration(
    $rp_id: String!
    $manager_kms_key_id: String!
    $is_unique_manager_key: Boolean!
  ) {
    update_rp_registration_by_pk(
      pk_columns: { rp_id: $rp_id }
      _set: {
        manager_kms_key_id: $manager_kms_key_id
        is_unique_manager_key: $is_unique_manager_key
      }
    ) {
      rp_id
      manager_kms_key_id
      is_unique_manager_key
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
