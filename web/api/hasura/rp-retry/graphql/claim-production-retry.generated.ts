/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type ClaimProductionRetryMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
}>;

export type ClaimProductionRetryMutation = {
  __typename?: "mutation_root";
  update_rp_registration?: {
    __typename?: "rp_registration_mutation_response";
    affected_rows: number;
    returning: Array<{
      __typename?: "rp_registration";
      rp_id: string;
      status: unknown;
    }>;
  } | null;
};

export const ClaimProductionRetryDocument = gql`
  mutation ClaimProductionRetry($rp_id: String!) {
    update_rp_registration(
      where: {
        rp_id: { _eq: $rp_id }
        status: { _eq: failed }
        mode: { _eq: managed }
        review_configuration_change_kind: { _is_null: true }
        app: {
          status: { _eq: "active" }
          is_archived: { _eq: false }
          deleted_at: { _is_null: true }
        }
      }
      _set: {
        status: pending
        review_configuration_change_kind: "registration_retry"
      }
    ) {
      affected_rows
      returning {
        rp_id
        status
      }
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
    ClaimProductionRetry(
      variables: ClaimProductionRetryMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<ClaimProductionRetryMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<ClaimProductionRetryMutation>(
            ClaimProductionRetryDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "ClaimProductionRetry",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
