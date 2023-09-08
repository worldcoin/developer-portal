/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type FetchUserQueryVariables = Types.Exact<{
  id: Types.Scalars["String"];
}>;

export type FetchUserQuery = {
  __typename?: "query_root";
  user: Array<{
    __typename?: "user";
    id: string;
    name: string;
    email: string;
    team: { __typename?: "team"; id: string; name?: string | null };
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
    FetchUser(
      variables: FetchUserQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders
    ): Promise<FetchUserQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchUserQuery>(FetchUserDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "FetchUser",
        "query"
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
