/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type InitialAppQueryVariables = Types.Exact<{
  teamId: Types.Scalars["String"]["input"];
}>;

export type InitialAppQuery = {
  __typename?: "query_root";
  app: Array<{ __typename?: "app"; id: string }>;
};

export const InitialAppDocument = gql`
  query InitialApp($teamId: String!) {
    app(
      where: { team: { id: { _eq: $teamId } }, deleted_at: { _is_null: true } }
      limit: 1
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
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
