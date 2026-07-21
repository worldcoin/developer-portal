/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type TouchDeletedAppRpMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  now: Types.Scalars["timestamptz"]["input"];
}>;

export type TouchDeletedAppRpMutation = {
  __typename?: "mutation_root";
  update_rp_registration_by_pk?: {
    __typename?: "rp_registration";
    rp_id: string;
    updated_at: string;
  } | null;
};

export const TouchDeletedAppRpDocument = gql`
  mutation TouchDeletedAppRp($rp_id: String!, $now: timestamptz!) {
    update_rp_registration_by_pk(
      pk_columns: { rp_id: $rp_id }
      _set: { updated_at: $now }
    ) {
      rp_id
      updated_at
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
    TouchDeletedAppRp(
      variables: TouchDeletedAppRpMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<TouchDeletedAppRpMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<TouchDeletedAppRpMutation>(
            TouchDeletedAppRpDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "TouchDeletedAppRp",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
