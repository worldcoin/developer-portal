/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type DeleteRpRegistrationMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
}>;

export type DeleteRpRegistrationMutation = {
  __typename?: "mutation_root";
  delete_rp_registration_by_pk?: {
    __typename?: "rp_registration";
    rp_id: string;
  } | null;
};

export const DeleteRpRegistrationDocument = gql`
  mutation DeleteRpRegistration($rp_id: String!) {
    delete_rp_registration_by_pk(rp_id: $rp_id) {
      rp_id
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
