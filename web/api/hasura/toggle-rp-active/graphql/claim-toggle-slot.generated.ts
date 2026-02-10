/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type ClaimToggleSlotMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  current_status: Types.Scalars["rp_registration_status"]["input"];
}>;

export type ClaimToggleSlotMutation = {
  __typename?: "mutation_root";
  update_rp_registration?: {
    __typename?: "rp_registration_mutation_response";
    affected_rows: number;
    returning: Array<{
      __typename?: "rp_registration";
      rp_id: string;
      app_id: string;
      status: unknown;
    }>;
  } | null;
};

export const ClaimToggleSlotDocument = gql`
  mutation ClaimToggleSlot(
    $rp_id: String!
    $current_status: rp_registration_status!
  ) {
    update_rp_registration(
      where: { rp_id: { _eq: $rp_id }, status: { _eq: $current_status } }
      _set: { status: pending }
    ) {
      affected_rows
      returning {
        rp_id
        app_id
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
    ClaimToggleSlot(
      variables: ClaimToggleSlotMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<ClaimToggleSlotMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<ClaimToggleSlotMutation>(
            ClaimToggleSlotDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "ClaimToggleSlot",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
