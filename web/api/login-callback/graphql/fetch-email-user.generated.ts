/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchEmailUserQueryVariables = Types.Exact<{
  auth0Id?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  email?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type FetchEmailUserQuery = {
  __typename?: "query_root";
  userByAuth0Id: Array<{
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
  userByEmail: Array<{
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

export const FetchEmailUserDocument = gql`
  query FetchEmailUser($auth0Id: String, $email: String) {
    userByAuth0Id: user(where: { auth0Id: { _eq: $auth0Id } }) {
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
    userByEmail: user(where: { email: { _eq: $email } }) {
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
    FetchEmailUser(
      variables?: FetchEmailUserQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchEmailUserQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchEmailUserQuery>(
            FetchEmailUserDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchEmailUser",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
