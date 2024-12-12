/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FinishAppReportMutationVariables = Types.Exact<{
  app_report_id: Types.Scalars["String"]["input"];
  reviewed_by: Types.Scalars["String"]["input"];
  review_status: Types.Scalars["review_status_enum"]["input"];
  review_conclusion_reason: Types.Scalars["String"]["input"];
}>;

export type FinishAppReportMutation = {
  __typename?: "mutation_root";
  update_app_report_by_pk?: { __typename: "app_report" } | null;
};

export const FinishAppReportDocument = gql`
  mutation FinishAppReport(
    $app_report_id: String!
    $reviewed_by: String!
    $review_status: review_status_enum!
    $review_conclusion_reason: String!
  ) {
    update_app_report_by_pk(
      pk_columns: { id: $app_report_id }
      _set: {
        reviewed_at: "now()"
        reviewed_by: $reviewed_by
        review_status: $review_status
        review_conclusion_reason: $review_conclusion_reason
      }
    ) {
      __typename
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
    FinishAppReport(
      variables: FinishAppReportMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FinishAppReportMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FinishAppReportMutation>(
            FinishAppReportDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FinishAppReport",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;