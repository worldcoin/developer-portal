/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchVerificationsQueryVariables = Types.Exact<{
  where: Types.Nullifier_Bool_Exp;
  limit: Types.Scalars["Int"]["input"];
  offset: Types.Scalars["Int"]["input"];
}>;

export type FetchVerificationsQuery = {
  __typename?: "query_root";
  nullifier: Array<{
    __typename?: "nullifier";
    id: string;
    nullifier_hash: string;
    uses: number;
    created_at: string;
    action: {
      __typename?: "action";
      id: string;
      action: string;
      name: string;
      app_id: string;
    };
  }>;
};

export const FetchVerificationsDocument = gql`
  query FetchVerifications(
    $where: nullifier_bool_exp!
    $limit: Int!
    $offset: Int!
  ) {
    nullifier(
      where: $where
      limit: $limit
      offset: $offset
      order_by: { created_at: desc }
    ) {
      id
      nullifier_hash
      uses
      created_at
      action {
        id
        action
        name
        app_id
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
    FetchVerifications(
      variables: FetchVerificationsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchVerificationsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchVerificationsQuery>(
            FetchVerificationsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchVerifications",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
