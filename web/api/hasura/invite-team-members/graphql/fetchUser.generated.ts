/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchUserQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type FetchUserQuery = {
  __typename?: "query_root";
  user: Array<{
    __typename?: "user";
    id: string;
    name: string;
    email?: string | null;
    team?: { __typename?: "team"; id: string; name?: string | null } | null;
  }>;
};

export const FetchUserDocument = gql`
  query FetchUser($id: String!) {
    user(where: { id: { _eq: $id } }) {
      id
      name
      email
      team {
        id
        name
      }
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
    FetchUser(
      variables: FetchUserQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchUserQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchUserQuery>(FetchUserDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "FetchUser",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
