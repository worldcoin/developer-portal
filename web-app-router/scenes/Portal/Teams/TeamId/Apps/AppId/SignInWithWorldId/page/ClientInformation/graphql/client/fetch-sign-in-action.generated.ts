/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type FetchSignInActionQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"];
}>;

export type FetchSignInActionQuery = {
  __typename?: "query_root";
  action: Array<{
    __typename?: "action";
    id: string;
    app_id: string;
    status: string;
    privacy_policy_uri?: string | null;
    terms_uri?: string | null;
  }>;
};

export const FetchSignInActionDocument = gql`
  query FetchSignInAction($app_id: String!) {
    action(where: { app_id: { _eq: $app_id }, action: { _eq: "" } }) {
      id
      app_id
      status
      privacy_policy_uri
      terms_uri
    }
  }
`;

/**
 * __useFetchSignInActionQuery__
 *
 * To run a query within a React component, call `useFetchSignInActionQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchSignInActionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchSignInActionQuery({
 *   variables: {
 *      app_id: // value for 'app_id'
 *   },
 * });
 */
export function useFetchSignInActionQuery(
  baseOptions: Apollo.QueryHookOptions<
    FetchSignInActionQuery,
    FetchSignInActionQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    FetchSignInActionQuery,
    FetchSignInActionQueryVariables
  >(FetchSignInActionDocument, options);
}
export function useFetchSignInActionLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    FetchSignInActionQuery,
    FetchSignInActionQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    FetchSignInActionQuery,
    FetchSignInActionQueryVariables
  >(FetchSignInActionDocument, options);
}
export type FetchSignInActionQueryHookResult = ReturnType<
  typeof useFetchSignInActionQuery
>;
export type FetchSignInActionLazyQueryHookResult = ReturnType<
  typeof useFetchSignInActionLazyQuery
>;
export type FetchSignInActionQueryResult = Apollo.QueryResult<
  FetchSignInActionQuery,
  FetchSignInActionQueryVariables
>;
