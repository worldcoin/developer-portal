/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UnbanAppMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
}>;

export type UnbanAppMutation = {
  __typename?: "mutation_root";
  update_app_by_pk?: { __typename?: "app"; id: string } | null;
};

export const UnbanAppDocument = gql`
  mutation UnbanApp($app_id: String!) {
    update_app_by_pk(pk_columns: { id: $app_id }, _set: { is_banned: false }) {
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
    UnbanApp(
      variables: UnbanAppMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UnbanAppMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UnbanAppMutation>(UnbanAppDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "UnbanApp",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
