/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type CreateAppReportMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  user_id: Types.Scalars["String"]["input"];
  reporter_email: Types.Scalars["String"]["input"];
  details?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
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
    $details: String
  ) {
    insert_app_report(
      objects: [
        {
          app_id: $app_id
          user_id: $user_id
          reporter_email: $reporter_email
          details: $details
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
