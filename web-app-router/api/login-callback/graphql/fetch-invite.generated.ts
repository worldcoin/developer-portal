/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from '@/graphql/graphql';

import { GraphQLClient } from 'graphql-request';
import { GraphQLClientRequestHeaders } from 'graphql-request/build/cjs/types';
import gql from 'graphql-tag';
export type InviteQueryVariables = Types.Exact<{
  id: Types.Scalars['String'];
}>;


export type InviteQuery = { __typename?: 'query_root', invite: Array<{ __typename?: 'invite', team_id: string, email: string, expires_at: any }> };


export const InviteDocument = gql`
    query Invite($id: String!) {
  invite(where: {id: {_eq: $id}}) {
    team_id
    email
    expires_at
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    Invite(variables: InviteQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<InviteQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<InviteQuery>(InviteDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'Invite', 'query');
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;