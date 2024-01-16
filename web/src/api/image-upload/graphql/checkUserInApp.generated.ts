/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type CheckUserInAppQueryVariables = Types.Exact<{
  team_id: Types.Scalars["String"];
  app_id: Types.Scalars["String"];
}>;

export type CheckUserInAppQuery = {
  __typename?: "query_root";
  team: Array<{
    __typename?: "team";
    apps: Array<{ __typename?: "app"; id: string }>;
  }>;
};

export const CheckUserInAppDocument = gql`
  query CheckUserInApp($team_id: String!, $app_id: String!) {
    team(where: { id: { _eq: $team_id } }) {
      apps(where: { id: { _eq: $app_id } }) {
        id
      }
    }
  }
`;

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType
) => action();

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper
) {
  return {
    CheckUserInApp(
      variables: CheckUserInAppQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders
    ): Promise<CheckUserInAppQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CheckUserInAppQuery>(
            CheckUserInAppDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders }
          ),
        "CheckUserInApp",
        "query"
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
