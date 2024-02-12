/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type RedirectsQueryVariables = Types.Exact<{
  action_id: Types.Scalars["String"];
}>;

export type RedirectsQuery = {
  __typename?: "query_root";
  redirect: Array<{
    __typename?: "redirect";
    id: string;
    action_id: string;
    redirect_uri: string;
    created_at: any;
    updated_at: any;
  }>;
};

export const RedirectsDocument = gql`
  query Redirects($action_id: String!) {
    redirect(
      where: { action_id: { _eq: $action_id } }
      order_by: { created_at: asc }
    ) {
      id
      action_id
      redirect_uri
      created_at
      updated_at
    }
  }
`;

/**
 * __useRedirectsQuery__
 *
 * To run a query within a React component, call `useRedirectsQuery` and pass it any options that fit your needs.
 * When your component renders, `useRedirectsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRedirectsQuery({
 *   variables: {
 *      action_id: // value for 'action_id'
 *   },
 * });
 */
export function useRedirectsQuery(
  baseOptions: Apollo.QueryHookOptions<RedirectsQuery, RedirectsQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<RedirectsQuery, RedirectsQueryVariables>(
    RedirectsDocument,
    options,
  );
}
export function useRedirectsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    RedirectsQuery,
    RedirectsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<RedirectsQuery, RedirectsQueryVariables>(
    RedirectsDocument,
    options,
  );
}
export type RedirectsQueryHookResult = ReturnType<typeof useRedirectsQuery>;
export type RedirectsLazyQueryHookResult = ReturnType<
  typeof useRedirectsLazyQuery
>;
export type RedirectsQueryResult = Apollo.QueryResult<
  RedirectsQuery,
  RedirectsQueryVariables
>;
