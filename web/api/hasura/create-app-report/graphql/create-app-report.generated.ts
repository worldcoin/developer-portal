/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type CreateAppReportMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  user_id: Types.Scalars["String"]["input"];
  reporter_email: Types.Scalars["String"]["input"];
  purpose: Types.Scalars["purpose_enum"]["input"];
  violation?: Types.InputMaybe<Types.Scalars["violation_enum"]["input"]>;
  details?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  illegal_content_category?: Types.InputMaybe<
    Types.Scalars["illegal_content_category_enum"]["input"]
  >;
  illegal_content_laws_broken?: Types.InputMaybe<
    Types.Scalars["String"]["input"]
  >;
  illegal_content_description?: Types.InputMaybe<
    Types.Scalars["String"]["input"]
  >;
  illegal_content_location?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type CreateAppReportMutation = {
  __typename?: "mutation_root";
  insert_app_report?: { __typename: "app_report_mutation_response" } | null;
};

export const CreateAppReportDocument = gql`
  mutation CreateAppReport(
    $app_id: String!
    $user_id: String!
    $reporter_email: String!
    $purpose: purpose_enum!
    $violation: violation_enum
    $details: String
    $illegal_content_category: illegal_content_category_enum
    $illegal_content_laws_broken: String
    $illegal_content_description: String
    $illegal_content_location: String
  ) {
    insert_app_report(
      objects: [
        {
          app_id: $app_id
          user_id: $user_id
          reporter_email: $reporter_email
          purpose: $purpose
          violation: $violation
          details: $details
          illegal_content_category: $illegal_content_category
          illegal_content_laws_broken: $illegal_content_laws_broken
          illegal_content_description: $illegal_content_description
          illegal_content_location: $illegal_content_location
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
