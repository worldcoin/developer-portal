/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type VerifyManagerKeySchemaQueryVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
}>;

export type VerifyManagerKeySchemaQuery = {
  __typename?: "query_root";
  rp_registration_by_pk?: {
    __typename?: "rp_registration";
    rp_id: string;
    is_unique_manager_key: boolean;
  } | null;
};

export const VerifyManagerKeySchemaDocument = gql`
  query VerifyManagerKeySchema($rp_id: String!) {
    rp_registration_by_pk(rp_id: $rp_id) {
      rp_id
      is_unique_manager_key
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
    VerifyManagerKeySchema(
      variables: VerifyManagerKeySchemaQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<VerifyManagerKeySchemaQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<VerifyManagerKeySchemaQuery>(
            VerifyManagerKeySchemaDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "VerifyManagerKeySchema",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
