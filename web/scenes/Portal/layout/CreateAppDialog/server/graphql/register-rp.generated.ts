/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type RegisterRpMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  signer_address: Types.Scalars["String"]["input"];
}>;

export type RegisterRpMutation = {
  __typename?: "mutation_root";
  register_rp?: {
    __typename?: "RegisterRpOutput";
    rp_id: string;
    manager_address: string;
    signer_address: string;
    status: string;
    operation_hash: string;
  } | null;
};

export const RegisterRpDocument = gql`
  mutation RegisterRp($app_id: String!, $signer_address: String!) {
    register_rp(app_id: $app_id, signer_address: $signer_address) {
      rp_id
      manager_address
      signer_address
      status
      operation_hash
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
    RegisterRp(
      variables: RegisterRpMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<RegisterRpMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<RegisterRpMutation>(RegisterRpDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "RegisterRp",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
