/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type RevertModeSwitchStatusMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
}>;

export type RevertModeSwitchStatusMutation = {
  __typename?: "mutation_root";
  update_rp_registration_by_pk?: {
    __typename?: "rp_registration";
    rp_id: string;
    app_id: string;
    status: unknown;
  } | null;
};

export const RevertModeSwitchStatusDocument = gql`
  mutation RevertModeSwitchStatus($rp_id: String!) {
    update_rp_registration_by_pk(
      pk_columns: { rp_id: $rp_id }
      _set: { status: registered }
    ) {
      rp_id
      app_id
      status
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
    RevertModeSwitchStatus(
      variables: RevertModeSwitchStatusMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<RevertModeSwitchStatusMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<RevertModeSwitchStatusMutation>(
            RevertModeSwitchStatusDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "RevertModeSwitchStatus",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
