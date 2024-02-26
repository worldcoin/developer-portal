/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type InitialAppQueryVariables = Types.Exact<{
  teamId: Types.Scalars["String"];
}>;

export type InitialAppQuery = {
  __typename?: "query_root";
  app: Array<{ __typename?: "app"; id: string }>;
};

export const InitialAppDocument = gql`
  query InitialApp($teamId: String!) {
    app(where: { team: { id: { _eq: $teamId } } }, limit: 1) {
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
    InitialApp(
      variables: InitialAppQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<InitialAppQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<InitialAppQuery>(InitialAppDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "InitialApp",
        "query",
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
