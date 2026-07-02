/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetDeletedAppRpsQueryVariables = Types.Exact<{
  before: Types.Scalars["timestamptz"]["input"];
  limit: Types.Scalars["Int"]["input"];
}>;

export type GetDeletedAppRpsQuery = {
  __typename?: "query_root";
  rp_registration: Array<{
    __typename?: "rp_registration";
    rp_id: string;
    app_id: string;
    status: unknown;
  }>;
};

export const GetDeletedAppRpsDocument = gql`
  query GetDeletedAppRps($before: timestamptz!, $limit: Int!) {
    rp_registration(
      where: {
        mode: { _eq: managed }
        manager_kms_key_id: { _is_null: false }
        status: { _neq: deactivated }
        updated_at: { _lt: $before }
        app: { deleted_at: { _is_null: false } }
      }
      order_by: { updated_at: asc }
      limit: $limit
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
    GetDeletedAppRps(
      variables: GetDeletedAppRpsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetDeletedAppRpsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetDeletedAppRpsQuery>(
            GetDeletedAppRpsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetDeletedAppRps",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
