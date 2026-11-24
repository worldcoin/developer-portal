/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type MergeWorldIdAccountsMutationVariables = Types.Exact<{
  current_user_id: Types.Scalars["String"]["input"];
  legacy_user_id: Types.Scalars["String"]["input"];
  world_id_nullifier: Types.Scalars["String"]["input"];
}>;

export type MergeWorldIdAccountsMutation = {
  __typename?: "mutation_root";
  merge_world_id_accounts: Array<{
    __typename?: "user";
    id: string;
    world_id_nullifier?: string | null;
  }>;
};

export const MergeWorldIdAccountsDocument = gql`
  mutation MergeWorldIdAccounts(
    $current_user_id: String!
    $legacy_user_id: String!
    $world_id_nullifier: String!
  ) {
    merge_world_id_accounts(
      args: {
        _current_user_id: $current_user_id
        _legacy_user_id: $legacy_user_id
        _world_id_nullifier: $world_id_nullifier
      }
    ) {
      id
      world_id_nullifier
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
    MergeWorldIdAccounts(
      variables: MergeWorldIdAccountsMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<MergeWorldIdAccountsMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<MergeWorldIdAccountsMutation>(
            MergeWorldIdAccountsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "MergeWorldIdAccounts",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
