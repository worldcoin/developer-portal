/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type CheckNullifierV4QueryVariables = Types.Exact<{
  nullifier: Types.Scalars["numeric"]["input"];
}>;

export type CheckNullifierV4Query = {
  __typename?: "query_root";
  nullifier_v4: Array<{
    __typename?: "nullifier_v4";
    id: string;
    nullifier: string;
    action_v4_id: string;
    created_at: string;
    action_v4: {
      __typename?: "action_v4";
      id: string;
      rp_id: string;
      action: string;
      environment: unknown;
    };
  }>;
};

export const CheckNullifierV4Document = gql`
  query CheckNullifierV4($nullifier: numeric!) {
    nullifier_v4(where: { nullifier: { _eq: $nullifier } }) {
      id
      nullifier
      action_v4_id
      created_at
      action_v4 {
        id
        rp_id
        action
        environment
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
    CheckNullifierV4(
      variables: CheckNullifierV4QueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<CheckNullifierV4Query> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CheckNullifierV4Query>(
            CheckNullifierV4Document,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "CheckNullifierV4",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
