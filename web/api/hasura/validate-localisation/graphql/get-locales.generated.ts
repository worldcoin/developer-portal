/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetLocalesQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
  team_id: Types.Scalars["String"]["input"];
  user_id: Types.Scalars["String"]["input"];
}>;

export type GetLocalesQuery = {
  __typename?: "query_root";
  app_metadata: Array<{
    __typename?: "app_metadata";
    supported_languages?: Array<string> | null;
    app_mode: string;
  }>;
};

export const GetLocalesDocument = gql`
  query GetLocales($id: String!, $team_id: String!, $user_id: String!) {
    app_metadata(
      where: {
        id: { _eq: $id }
        app: {
          team_id: { _eq: $team_id }
          team: {
            memberships: {
              user_id: { _eq: $user_id }
              role: { _in: [ADMIN, OWNER] }
            }
          }
        }
      }
    ) {
      supported_languages
      app_mode
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
    GetLocales(
      variables: GetLocalesQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetLocalesQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetLocalesQuery>(GetLocalesDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "GetLocales",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
