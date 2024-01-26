/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type FetchNullifierUserQueryVariables = Types.Exact<{
  auth0Id: Types.Scalars["String"];
  world_id_nullifier: Types.Scalars["String"];
}>;

export type FetchNullifierUserQuery = {
  __typename?: "query_root";
  user: Array<{
    __typename?: "user";
    id: string;
    auth0Id?: string | null;
    team_id: string;
    posthog_id?: string | null;
    name: string;
    email?: string | null;
  }>;
};

export const FetchNullifierUserDocument = gql`
  query FetchNullifierUser($auth0Id: String!, $world_id_nullifier: String!) {
    user(
      where: {
        _or: [
          { auth0Id: { _eq: $auth0Id } }
          { world_id_nullifier: { _eq: $world_id_nullifier } }
        ]
      }
    ) {
      id
      auth0Id
      team_id
      posthog_id
      name
      email
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
    FetchNullifierUser(
      variables: FetchNullifierUserQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchNullifierUserQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchNullifierUserQuery>(
            FetchNullifierUserDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchNullifierUser",
        "query",
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
