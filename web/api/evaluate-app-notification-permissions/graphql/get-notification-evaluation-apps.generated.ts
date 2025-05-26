/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetNotificationEvaluationAppsQueryVariables = Types.Exact<{
  appIds?: Types.InputMaybe<
    Array<Types.Scalars["String"]["input"]> | Types.Scalars["String"]["input"]
  >;
}>;

export type GetNotificationEvaluationAppsQuery = {
  __typename?: "query_root";
  app_metadata: Array<{
    __typename?: "app_metadata";
    app_id: string;
    notification_state: string;
    notification_state_changed_date?: string | null;
    is_allowed_unlimited_notifications?: boolean | null;
    max_notifications_per_day?: number | null;
  }>;
};

export const GetNotificationEvaluationAppsDocument = gql`
  query GetNotificationEvaluationApps($appIds: [String!]) {
    app_metadata(
      where: {
        verification_status: { _eq: "verified" }
        app_id: { _in: $appIds }
      }
      order_by: { created_at: asc }
      limit: 1000
    ) {
      app_id
      notification_state
      notification_state_changed_date
      is_allowed_unlimited_notifications
      max_notifications_per_day
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
    GetNotificationEvaluationApps(
      variables?: GetNotificationEvaluationAppsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetNotificationEvaluationAppsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetNotificationEvaluationAppsQuery>(
            GetNotificationEvaluationAppsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetNotificationEvaluationApps",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
