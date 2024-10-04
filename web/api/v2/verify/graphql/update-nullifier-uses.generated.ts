/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateNullifierUsesMutationVariables = Types.Exact<{
  nullifier_hash: Types.Scalars["String"]["input"];
  uses: Types.Scalars["Int"]["input"];
}>;

export type UpdateNullifierUsesMutation = {
  __typename?: "mutation_root";
  update_nullifier?: {
    __typename?: "nullifier_mutation_response";
    affected_rows: number;
  } | null;
};

export const UpdateNullifierUsesDocument = gql`
  mutation UpdateNullifierUses($nullifier_hash: String!, $uses: Int!) {
    update_nullifier(
      where: { uses: { _eq: $uses }, nullifier_hash: { _eq: $nullifier_hash } }
      _inc: { uses: 1 }
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
    UpdateNullifierUses(
      variables: UpdateNullifierUsesMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateNullifierUsesMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateNullifierUsesMutation>(
            UpdateNullifierUsesDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "UpdateNullifierUses",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
