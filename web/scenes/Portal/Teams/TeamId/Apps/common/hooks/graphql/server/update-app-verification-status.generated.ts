/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateAppVerificationStatusMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  verification_status: Types.Scalars["String"]["input"];
}>;

export type UpdateAppVerificationStatusMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
};

export const UpdateAppVerificationStatusDocument = gql`
  mutation UpdateAppVerificationStatus(
    $app_metadata_id: String!
    $verification_status: String!
  ) {
    update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: { verification_status: $verification_status }
    ) {
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
    UpdateAppVerificationStatus(
      variables: UpdateAppVerificationStatusMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateAppVerificationStatusMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateAppVerificationStatusMutation>(
            UpdateAppVerificationStatusDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "UpdateAppVerificationStatus",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
