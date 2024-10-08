/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type BanAppMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
}>;

export type BanAppMutation = {
  __typename?: "mutation_root";
  update_app_by_pk?: { __typename?: "app"; id: string } | null;
};

export const BanAppDocument = gql`
  mutation BanApp($app_id: String!) {
    update_app_by_pk(pk_columns: { id: $app_id }, _set: { is_banned: true }) {
      id
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
    BanApp(
      variables: BanAppMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<BanAppMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<BanAppMutation>(BanAppDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "BanApp",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
