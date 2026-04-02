/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateRpRegistrationMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  manager_kms_key_id: Types.Scalars["String"]["input"];
  operation_hash: Types.Scalars["String"]["input"];
  staging_operation_hash?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  staging_status?: Types.InputMaybe<
    Types.Scalars["rp_registration_status"]["input"]
  >;
}>;

export type UpdateRpRegistrationMutation = {
  __typename?: "mutation_root";
  update_rp_registration_by_pk?: {
    __typename?: "rp_registration";
    rp_id: string;
    app_id: string;
    status: unknown;
    manager_kms_key_id?: string | null;
    operation_hash?: string | null;
    staging_status?: unknown | null;
    staging_operation_hash?: string | null;
  } | null;
};

export const UpdateRpRegistrationDocument = gql`
  mutation UpdateRpRegistration(
    $rp_id: String!
    $manager_kms_key_id: String!
    $operation_hash: String!
    $staging_operation_hash: String
    $staging_status: rp_registration_status
  ) {
    update_rp_registration_by_pk(
      pk_columns: { rp_id: $rp_id }
      _set: {
        manager_kms_key_id: $manager_kms_key_id
        operation_hash: $operation_hash
        staging_operation_hash: $staging_operation_hash
        staging_status: $staging_status
      }
    ) {
      rp_id
      app_id
      status
      manager_kms_key_id
      operation_hash
      staging_status
      staging_operation_hash
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
    UpdateRpRegistration(
      variables: UpdateRpRegistrationMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateRpRegistrationMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateRpRegistrationMutation>(
            UpdateRpRegistrationDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "UpdateRpRegistration",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
