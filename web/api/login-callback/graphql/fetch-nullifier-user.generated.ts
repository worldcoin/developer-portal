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
    email?: string | null;
    name: string;
    auth0Id?: string | null;
    posthog_id?: string | null;
    is_allow_tracking?: boolean | null;
    world_id_nullifier?: string | null;
    memberships: Array<{
      __typename?: "membership";
      role: Types.Role_Enum;
      team: { __typename?: "team"; id: string; name?: string | null };
    }>;
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
      email
      name
      auth0Id
      posthog_id
      is_allow_tracking
      world_id_nullifier
      name
      memberships {
        team {
          id
          name
        }
        role
      }
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
