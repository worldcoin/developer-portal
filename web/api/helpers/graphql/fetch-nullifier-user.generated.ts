/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchNullifierUserQueryVariables = Types.Exact<{
  auth0Id: Types.Scalars["String"]["input"];
  world_id_nullifier: Types.Scalars["String"]["input"];
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
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
