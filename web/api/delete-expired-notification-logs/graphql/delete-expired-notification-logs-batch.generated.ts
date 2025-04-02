/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type DeleteExpiredNotificationLogsMutationVariables = Types.Exact<{
  notificationLogIds?: Types.InputMaybe<
    Array<Types.Scalars["String"]["input"]> | Types.Scalars["String"]["input"]
  >;
}>;

export type DeleteExpiredNotificationLogsMutation = {
  __typename?: "mutation_root";
  delete_notification_log?: {
    __typename?: "notification_log_mutation_response";
    affected_rows: number;
  } | null;
};

export const DeleteExpiredNotificationLogsDocument = gql`
  mutation DeleteExpiredNotificationLogs($notificationLogIds: [String!]) {
    delete_notification_log(where: { id: { _in: $notificationLogIds } }) {
      affected_rows
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
    DeleteExpiredNotificationLogs(
      variables?: DeleteExpiredNotificationLogsMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<DeleteExpiredNotificationLogsMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<DeleteExpiredNotificationLogsMutation>(
            DeleteExpiredNotificationLogsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "DeleteExpiredNotificationLogs",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
