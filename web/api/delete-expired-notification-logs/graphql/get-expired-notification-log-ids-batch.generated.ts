/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetExpiredNotificationLogIdsBatchQueryVariables = Types.Exact<{
  beforeDate: Types.Scalars["timestamptz"]["input"];
}>;

export type GetExpiredNotificationLogIdsBatchQuery = {
  __typename?: "query_root";
  notification_log: Array<{ __typename?: "notification_log"; id: string }>;
};

export const GetExpiredNotificationLogIdsBatchDocument = gql`
  query GetExpiredNotificationLogIdsBatch($beforeDate: timestamptz!) {
    notification_log(
      where: { created_at: { _lte: $beforeDate } }
      order_by: { created_at: asc }
      limit: 500
    ) {
      id
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
    GetExpiredNotificationLogIdsBatch(
      variables: GetExpiredNotificationLogIdsBatchQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetExpiredNotificationLogIdsBatchQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetExpiredNotificationLogIdsBatchQuery>(
            GetExpiredNotificationLogIdsBatchDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetExpiredNotificationLogIdsBatch",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
