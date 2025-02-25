/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type CreateAppReportMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  user_pkid: Types.Scalars["String"]["input"];
  reporter_email: Types.Scalars["String"]["input"];
  purpose: Types.Scalars["purpose_enum"]["input"];
  violation?: Types.InputMaybe<Types.Scalars["violation_enum"]["input"]>;
  details?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  illegal_content_sub_category?: Types.InputMaybe<
    Types.Scalars["illegal_content_sub_category_enum"]["input"]
  >;
  illegal_content_legal_reason?: Types.InputMaybe<
    Types.Scalars["String"]["input"]
  >;
  illegal_content_description?: Types.InputMaybe<
    Types.Scalars["String"]["input"]
  >;
  illegal_content_country_code?: Types.InputMaybe<
    Types.Scalars["String"]["input"]
  >;
}>;

export type CreateAppReportMutation = {
  __typename?: "mutation_root";
  insert_app_report?: { __typename: "app_report_mutation_response" } | null;
};

export const CreateAppReportDocument = gql`
  mutation CreateAppReport(
    $app_id: String!
    $user_pkid: String!
    $reporter_email: String!
    $purpose: purpose_enum!
    $violation: violation_enum
    $details: String
    $illegal_content_sub_category: illegal_content_sub_category_enum
    $illegal_content_legal_reason: String
    $illegal_content_description: String
    $illegal_content_country_code: String
  ) {
    insert_app_report(
      objects: [
        {
          app_id: $app_id
          user_pkid: $user_pkid
          review_status: OPEN
          reporter_email: $reporter_email
          purpose: $purpose
          violation: $violation
          details: $details
          illegal_content_sub_category: $illegal_content_sub_category
          illegal_content_legal_reason: $illegal_content_legal_reason
          illegal_content_description: $illegal_content_description
          illegal_content_country_code: $illegal_content_country_code
        }
      ]
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
    CreateAppReport(
      variables: CreateAppReportMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<CreateAppReportMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CreateAppReportMutation>(
            CreateAppReportDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "CreateAppReport",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
