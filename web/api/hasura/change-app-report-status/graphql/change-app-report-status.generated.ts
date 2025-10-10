/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type ChangeAppReportStatusMutationVariables = Types.Exact<{
  updates: Array<Types.App_Report_Updates> | Types.App_Report_Updates;
}>;

export type ChangeAppReportStatusMutation = {
  __typename?: "mutation_root";
  update_app_report_many?: Array<{
    __typename?: "app_report_mutation_response";
    affected_rows: number;
    returning: Array<{ __typename: "app_report"; id: string }>;
  } | null> | null;
};

export const ChangeAppReportStatusDocument = gql`
  mutation ChangeAppReportStatus($updates: [app_report_updates!]!) {
    update_app_report_many(updates: $updates) {
      affected_rows
      returning {
        id
        __typename
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
    ChangeAppReportStatus(
      variables: ChangeAppReportStatusMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<ChangeAppReportStatusMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<ChangeAppReportStatusMutation>(
            ChangeAppReportStatusDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "ChangeAppReportStatus",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
