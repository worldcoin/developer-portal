/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type CreateNotificationLogMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  mini_app_path: Types.Scalars["String"]["input"];
  message?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type CreateNotificationLogMutation = {
  __typename?: "mutation_root";
  insert_notification_log_one?: {
    __typename?: "notification_log";
    id: string;
  } | null;
};

export type CreateWalletAdressNotificationLogsMutationVariables = Types.Exact<{
  objects:
    | Array<Types.Notification_Log_Wallet_Address_Insert_Input>
    | Types.Notification_Log_Wallet_Address_Insert_Input;
}>;

export type CreateWalletAdressNotificationLogsMutation = {
  __typename?: "mutation_root";
  insert_notification_log_wallet_address?: {
    __typename?: "notification_log_wallet_address_mutation_response";
    affected_rows: number;
  } | null;
};

export const CreateNotificationLogDocument = gql`
  mutation CreateNotificationLog(
    $app_id: String!
    $mini_app_path: String!
    $message: String
  ) {
    insert_notification_log_one(
      object: {
        app_id: $app_id
        mini_app_path: $mini_app_path
        message: $message
      }
    ) {
      id
    }
  }
`;
export const CreateWalletAdressNotificationLogsDocument = gql`
  mutation CreateWalletAdressNotificationLogs(
    $objects: [notification_log_wallet_address_insert_input!]!
  ) {
    insert_notification_log_wallet_address(objects: $objects) {
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
    CreateNotificationLog(
      variables: CreateNotificationLogMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<CreateNotificationLogMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CreateNotificationLogMutation>(
            CreateNotificationLogDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "CreateNotificationLog",
        "mutation",
        variables,
      );
    },
    CreateWalletAdressNotificationLogs(
      variables: CreateWalletAdressNotificationLogsMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<CreateWalletAdressNotificationLogsMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CreateWalletAdressNotificationLogsMutation>(
            CreateWalletAdressNotificationLogsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "CreateWalletAdressNotificationLogs",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
