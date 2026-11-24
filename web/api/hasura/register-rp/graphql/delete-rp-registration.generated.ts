/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type DeleteRpRegistrationMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  app_id: Types.Scalars["String"]["input"];
}>;

export type DeleteRpRegistrationMutation = {
  __typename?: "mutation_root";
  delete_rp_registration?: {
    __typename?: "rp_registration_mutation_response";
    affected_rows: number;
  } | null;
};

export const DeleteRpRegistrationDocument = gql`
  mutation DeleteRpRegistration($rp_id: String!, $app_id: String!) {
    delete_rp_registration(
      where: {
        rp_id: { _eq: $rp_id }
        app_id: { _eq: $app_id }
        manager_kms_key_id: { _is_null: true }
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
    DeleteRpRegistration(
      variables: DeleteRpRegistrationMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<DeleteRpRegistrationMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<DeleteRpRegistrationMutation>(
            DeleteRpRegistrationDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "DeleteRpRegistration",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
