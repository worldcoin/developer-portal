/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type TeamsQueryVariables = Types.Exact<{ [key: string]: never }>;

export type TeamsQuery = {
  __typename?: "query_root";
  team: Array<{ __typename?: "team"; id: string }>;
};

export const TeamsDocument = gql`
  query Teams {
    team {
      id
    }
  }
`;

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType,
) => action();

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper,
) {
  return {
    Teams(
      variables?: TeamsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<TeamsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<TeamsQuery>(TeamsDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "Teams",
        "query",
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
