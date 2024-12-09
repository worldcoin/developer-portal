/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateAppRatingSumMutationMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  rating: Types.Scalars["Int"]["input"];
}>;

export type UpdateAppRatingSumMutationMutation = {
  __typename?: "mutation_root";
  update_app?: {
    __typename?: "app_mutation_response";
    affected_rows: number;
  } | null;
};

export const UpdateAppRatingSumMutationDocument = gql`
  mutation UpdateAppRatingSumMutation($app_id: String!, $rating: Int!) {
    update_app(
      where: { id: { _eq: $app_id } }
      _inc: { rating_count: 1, rating_sum: $rating }
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
    UpdateAppRatingSumMutation(
      variables: UpdateAppRatingSumMutationMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateAppRatingSumMutationMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateAppRatingSumMutationMutation>(
            UpdateAppRatingSumMutationDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "UpdateAppRatingSumMutation",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
