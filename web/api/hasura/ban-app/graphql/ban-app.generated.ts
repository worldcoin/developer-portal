/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type BanAppMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"];
}>;

export type BanAppMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
};

export const BanAppDocument = gql`
  mutation BanApp($app_id: String!) {
    update_app_metadata_by_pk(
      pk_columns: { id: $app_id }
      _set: { is_banned: true }
    ) {
      id
    }
  }
`;

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType,
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
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
