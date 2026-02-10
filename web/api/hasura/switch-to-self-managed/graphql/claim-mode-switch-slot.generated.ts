/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type ClaimModeSwitchSlotMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
}>;

export type ClaimModeSwitchSlotMutation = {
  __typename?: "mutation_root";
  update_rp_registration?: {
    __typename?: "rp_registration_mutation_response";
    affected_rows: number;
    returning: Array<{
      __typename?: "rp_registration";
      rp_id: string;
      app_id: string;
      status: unknown;
      manager_kms_key_id?: string | null;
    }>;
  } | null;
};

export const ClaimModeSwitchSlotDocument = gql`
  mutation ClaimModeSwitchSlot($rp_id: String!) {
    update_rp_registration(
      where: { rp_id: { _eq: $rp_id }, status: { _eq: registered } }
      _set: { status: pending }
    ) {
      affected_rows
      returning {
        rp_id
        app_id
        status
        manager_kms_key_id
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
    ClaimModeSwitchSlot(
      variables: ClaimModeSwitchSlotMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<ClaimModeSwitchSlotMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<ClaimModeSwitchSlotMutation>(
            ClaimModeSwitchSlotDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "ClaimModeSwitchSlot",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
