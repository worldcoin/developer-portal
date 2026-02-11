/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateAppInfoMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  app_id: Types.Scalars["String"]["input"];
  input?: Types.InputMaybe<Types.App_Metadata_Set_Input>;
  engine: Types.Scalars["String"]["input"];
}>;

export type UpdateAppInfoMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
  update_app_by_pk?: { __typename?: "app"; id: string } | null;
};

export const UpdateAppInfoDocument = gql`
  mutation UpdateAppInfo(
    $app_metadata_id: String!
    $app_id: String!
    $input: app_metadata_set_input
    $engine: String!
  ) {
    update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: $input
    ) {
      id
    }
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
    UpdateAppInfo(
      variables: UpdateAppInfoMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateAppInfoMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateAppInfoMutation>(
            UpdateAppInfoDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "UpdateAppInfo",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
