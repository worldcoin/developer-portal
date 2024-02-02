/* eslint-disable */
import * as Types from '@/graphql/graphql';

import { GraphQLClient } from 'graphql-request';
import { GraphQLClientRequestHeaders } from 'graphql-request/build/cjs/types';
import gql from 'graphql-tag';
export type DebuggerQueryVariables = Types.Exact<{
  action_id: Types.Scalars['String'];
}>;


export type DebuggerQuery = { __typename?: 'query_root', action: Array<{ __typename?: 'action', id: string, app_id: string, name: string, action: string, app: { __typename?: 'app', is_staging: boolean } }> };


export const DebuggerDocument = gql`
    query Debugger($action_id: String!) {
  action(order_by: {created_at: asc}, where: {id: {_eq: $action_id}}) {
    id
    app_id
    name
    action
    app {
      is_staging
    }
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    Debugger(variables: DebuggerQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<DebuggerQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<DebuggerQuery>(DebuggerDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'Debugger', 'query');
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;