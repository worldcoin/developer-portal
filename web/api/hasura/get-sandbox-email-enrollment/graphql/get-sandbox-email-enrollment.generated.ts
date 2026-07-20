/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetSandboxEmailEnrollmentQueryVariables = Types.Exact<{
  team_id: Types.Scalars["String"]["input"];
  user_id: Types.Scalars["String"]["input"];
}>;

export type GetSandboxEmailEnrollmentQuery = {
  __typename?: "query_root";
  sandbox_email_enrollment: Array<{
    __typename?: "sandbox_email_enrollment";
    id: string;
    team_id: string;
    user_id: string;
    email: string;
    created_at: string;
    updated_at: string;
  }>;
  team: Array<{ __typename?: "team"; id: string }>;
};

export const GetSandboxEmailEnrollmentDocument = gql`
  query GetSandboxEmailEnrollment($team_id: String!, $user_id: String!) {
    sandbox_email_enrollment(
      where: {
        team_id: { _eq: $team_id }
        user_id: { _eq: $user_id }
      }
      limit: 1
    ) {
      id
      team_id
      user_id
      email
      created_at
      updated_at
    }
    team(
      where: {
        id: { _eq: $team_id }
        memberships: { user_id: { _eq: $user_id } }
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
    GetSandboxEmailEnrollment(
      variables: GetSandboxEmailEnrollmentQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetSandboxEmailEnrollmentQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetSandboxEmailEnrollmentQuery>(
            GetSandboxEmailEnrollmentDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetSandboxEmailEnrollment",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
