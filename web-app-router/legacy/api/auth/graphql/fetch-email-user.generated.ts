/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from '@/graphql/graphql';

import { GraphQLClient } from 'graphql-request';
import { GraphQLClientRequestHeaders } from 'graphql-request/build/cjs/types';
import gql from 'graphql-tag';
export type FetchEmailUserQueryVariables = Types.Exact<{
  auth0Id?: Types.InputMaybe<Types.Scalars['String']>;
  email?: Types.InputMaybe<Types.Scalars['String']>;
}>;


export type FetchEmailUserQuery = { __typename?: 'query_root', userByAuth0Id: Array<{ __typename?: 'user', id: string, auth0Id?: string | null, team_id: string, posthog_id?: string | null, email?: string | null, name: string }>, userByEmail: Array<{ __typename?: 'user', id: string, auth0Id?: string | null, team_id: string, posthog_id?: string | null, email?: string | null, name: string }> };


export const FetchEmailUserDocument = gql`
    query FetchEmailUser($auth0Id: String, $email: String) {
  userByAuth0Id: user(where: {auth0Id: {_eq: $auth0Id}}) {
    id
    auth0Id
    team_id
    posthog_id
    email
    name
  }
  userByEmail: user(where: {email: {_eq: $email}}) {
    id
    auth0Id
    team_id
    posthog_id
    email
    name
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    FetchEmailUser(variables?: FetchEmailUserQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<FetchEmailUserQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<FetchEmailUserQuery>(FetchEmailUserDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'FetchEmailUser', 'query');
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;