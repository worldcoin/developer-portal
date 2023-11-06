/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type FetchUserByAuth0IdQueryVariables = Types.Exact<{
  auth0Id: Types.Scalars["String"];
}>;

export type FetchUserByAuth0IdQuery = {
  __typename?: "query_root";
  user: Array<{
    __typename?: "user";
    id: string;
    auth0Id?: string | null;
    team_id: string;
  }>;
};

export const FetchUserByAuth0IdDocument = gql`
  query FetchUserByAuth0Id($auth0Id: String!) {
    user(where: { auth0Id: { _eq: $auth0Id } }) {
      id
      auth0Id
      team_id
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
    FetchUserByAuth0Id(
      variables: FetchUserByAuth0IdQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders
    ): Promise<FetchUserByAuth0IdQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchUserByAuth0IdQuery>(
            FetchUserByAuth0IdDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders }
          ),
        "FetchUserByAuth0Id",
        "query"
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
