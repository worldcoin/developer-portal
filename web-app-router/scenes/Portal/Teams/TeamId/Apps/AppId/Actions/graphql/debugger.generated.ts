/* eslint-disable */
import * as Types from '@/graphql/graphql';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
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

/**
 * __useDebuggerQuery__
 *
 * To run a query within a React component, call `useDebuggerQuery` and pass it any options that fit your needs.
 * When your component renders, `useDebuggerQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDebuggerQuery({
 *   variables: {
 *      action_id: // value for 'action_id'
 *   },
 * });
 */
export function useDebuggerQuery(baseOptions: Apollo.QueryHookOptions<DebuggerQuery, DebuggerQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<DebuggerQuery, DebuggerQueryVariables>(DebuggerDocument, options);
      }
export function useDebuggerLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<DebuggerQuery, DebuggerQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<DebuggerQuery, DebuggerQueryVariables>(DebuggerDocument, options);
        }
export type DebuggerQueryHookResult = ReturnType<typeof useDebuggerQuery>;
export type DebuggerLazyQueryHookResult = ReturnType<typeof useDebuggerLazyQuery>;
export type DebuggerQueryResult = Apollo.QueryResult<DebuggerQuery, DebuggerQueryVariables>;