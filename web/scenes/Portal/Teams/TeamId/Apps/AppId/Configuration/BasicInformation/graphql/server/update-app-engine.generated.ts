/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateAppEngineMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  engine: Types.Scalars["String"]["input"];
}>;

export type UpdateAppEngineMutation = {
  __typename?: "mutation_root";
  update_app_by_pk?: { __typename?: "app"; id: string } | null;
};

export const UpdateAppEngineDocument = gql`
  mutation UpdateAppEngine($app_id: String!, $engine: String!) {
    update_app_by_pk(pk_columns: { id: $app_id }, _set: { engine: $engine }) {
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
    UpdateAppEngine(
      variables: UpdateAppEngineMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateAppEngineMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateAppEngineMutation>(
            UpdateAppEngineDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "UpdateAppEngine",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
