/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateNotificationPermissionStatusMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  notification_permission_status?: Types.InputMaybe<
    Types.Scalars["String"]["input"]
  >;
  notification_permission_status_changed_date?: Types.InputMaybe<
    Types.Scalars["timestamptz"]["input"]
  >;
}>;

export type UpdateNotificationPermissionStatusMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
};

export const UpdateNotificationPermissionStatusDocument = gql`
  mutation UpdateNotificationPermissionStatus(
    $app_id: String!
    $notification_permission_status: String
    $notification_permission_status_changed_date: timestamptz
  ) {
    update_app_metadata_by_pk(
      pk_columns: { id: $app_id }
      _set: {
        notification_permission_status: $notification_permission_status
        notification_permission_status_changed_date: $notification_permission_status_changed_date
      }
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
    UpdateNotificationPermissionStatus(
      variables: UpdateNotificationPermissionStatusMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateNotificationPermissionStatusMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateNotificationPermissionStatusMutation>(
            UpdateNotificationPermissionStatusDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "UpdateNotificationPermissionStatus",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
