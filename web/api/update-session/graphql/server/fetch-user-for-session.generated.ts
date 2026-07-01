/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchUserForSessionQueryVariables = Types.Exact<{
  userId: Types.Scalars["String"]["input"];
}>;

export type FetchUserForSessionQuery = {
  __typename?: "query_root";
  user_by_pk?: {
    __typename?: "user";
    id: string;
    name: string;
    email?: string | null;
    world_id_nullifier?: string | null;
    posthog_id?: string | null;
    is_allow_tracking?: boolean | null;
    memberships: Array<{
      __typename?: "membership";
      role: Types.Role_Enum;
      team: { __typename?: "team"; id: string; name?: string | null };
    }>;
  } | null;
};

export const FetchUserForSessionDocument = gql`
  query FetchUserForSession($userId: String!) {
    user_by_pk(id: $userId) {
      id
      name
      email
      world_id_nullifier
      posthog_id
      is_allow_tracking
      memberships {
        role
        team {
          id
          name
        }
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
    FetchUserForSession(
      variables: FetchUserForSessionQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchUserForSessionQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchUserForSessionQuery>(
            FetchUserForSessionDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchUserForSession",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
