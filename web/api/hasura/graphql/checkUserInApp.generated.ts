/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type CheckUserInAppQueryVariables = Types.Exact<{
  team_id: Types.Scalars["String"]["input"];
  app_id: Types.Scalars["String"]["input"];
  user_id: Types.Scalars["String"]["input"];
}>;

export type CheckUserInAppQuery = {
  __typename?: "query_root";
  team: Array<{ __typename?: "team"; id: string }>;
};

export const CheckUserInAppDocument = gql`
  query CheckUserInApp($team_id: String!, $app_id: String!, $user_id: String!) {
    team(
      where: {
        id: { _eq: $team_id }
        apps: { id: { _eq: $app_id } }
        memberships: {
          user_id: { _eq: $user_id }
          role: { _in: [ADMIN, OWNER] }
        }
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
    CheckUserInApp(
      variables: CheckUserInAppQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<CheckUserInAppQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CheckUserInAppQuery>(
            CheckUserInAppDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "CheckUserInApp",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
