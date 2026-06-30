/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type ResetStalePendingRpMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
}>;

export type ResetStalePendingRpMutation = {
  __typename?: "mutation_root";
  update_rp_registration?: {
    __typename?: "rp_registration_mutation_response";
    affected_rows: number;
  } | null;
};

export const ResetStalePendingRpDocument = gql`
  mutation ResetStalePendingRp($rp_id: String!) {
    update_rp_registration(
      where: { rp_id: { _eq: $rp_id }, status: { _eq: pending } }
      _set: { status: registered }
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
    ResetStalePendingRp(
      variables: ResetStalePendingRpMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<ResetStalePendingRpMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<ResetStalePendingRpMutation>(
            ResetStalePendingRpDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "ResetStalePendingRp",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
