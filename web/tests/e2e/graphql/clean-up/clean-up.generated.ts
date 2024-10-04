/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type CleanUpMutationVariables = Types.Exact<{
  name: Types.Scalars["String"]["input"];
  email: Types.Scalars["String"]["input"];
}>;

export type CleanUpMutation = {
  __typename?: "mutation_root";
  delete_user?: {
    __typename?: "user_mutation_response";
    affected_rows: number;
  } | null;
  delete_team?: {
    __typename?: "team_mutation_response";
    affected_rows: number;
  } | null;
};

export const CleanUpDocument = gql`
  mutation CleanUp($name: String!, $email: String!) {
    delete_user(where: { email: { _eq: $email } }) {
      affected_rows
    }
    delete_team(where: { name: { _like: $name } }) {
      affected_rows
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
    CleanUp(
      variables: CleanUpMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<CleanUpMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CleanUpMutation>(CleanUpDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "CleanUp",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
