/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type GetAppByTeamIdQueryVariables = Types.Exact<{
  team_id: Types.Scalars["String"];
}>;

export type GetAppByTeamIdQuery = {
  __typename?: "query_root";
  app: Array<{ __typename?: "app"; id: string }>;
};

export const GetAppByTeamIdDocument = gql`
  query GetAppByTeamId($team_id: String!) {
    app(where: { team: { id: { _eq: $team_id } } }, limit: 1) {
      id
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
    GetAppByTeamId(
      variables: GetAppByTeamIdQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders
    ): Promise<GetAppByTeamIdQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetAppByTeamIdQuery>(
            GetAppByTeamIdDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders }
          ),
        "GetAppByTeamId",
        "query"
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
