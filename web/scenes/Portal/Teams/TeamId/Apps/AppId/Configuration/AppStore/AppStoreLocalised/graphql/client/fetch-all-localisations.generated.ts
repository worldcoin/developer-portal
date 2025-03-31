/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type FetchAllLocalisationsQueryVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
}>;

export type FetchAllLocalisationsQuery = {
  __typename?: "query_root";
  localisations: Array<{ __typename?: "localisations"; locale: string }>;
};

export const FetchAllLocalisationsDocument = gql`
  query FetchAllLocalisations($app_metadata_id: String!) {
    localisations(where: { app_metadata_id: { _eq: $app_metadata_id } }) {
      locale
    }
  }
`;

/**
 * __useFetchAllLocalisationsQuery__
 *
 * To run a query within a React component, call `useFetchAllLocalisationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchAllLocalisationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchAllLocalisationsQuery({
 *   variables: {
 *      app_metadata_id: // value for 'app_metadata_id'
 *   },
 * });
 */
export function useFetchAllLocalisationsQuery(
  baseOptions: Apollo.QueryHookOptions<
    FetchAllLocalisationsQuery,
    FetchAllLocalisationsQueryVariables
  > &
    (
      | { variables: FetchAllLocalisationsQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    FetchAllLocalisationsQuery,
    FetchAllLocalisationsQueryVariables
  >(FetchAllLocalisationsDocument, options);
}
export function useFetchAllLocalisationsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    FetchAllLocalisationsQuery,
    FetchAllLocalisationsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    FetchAllLocalisationsQuery,
    FetchAllLocalisationsQueryVariables
  >(FetchAllLocalisationsDocument, options);
}
export function useFetchAllLocalisationsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        FetchAllLocalisationsQuery,
        FetchAllLocalisationsQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    FetchAllLocalisationsQuery,
    FetchAllLocalisationsQueryVariables
  >(FetchAllLocalisationsDocument, options);
}
export type FetchAllLocalisationsQueryHookResult = ReturnType<
  typeof useFetchAllLocalisationsQuery
>;
export type FetchAllLocalisationsLazyQueryHookResult = ReturnType<
  typeof useFetchAllLocalisationsLazyQuery
>;
export type FetchAllLocalisationsSuspenseQueryHookResult = ReturnType<
  typeof useFetchAllLocalisationsSuspenseQuery
>;
export type FetchAllLocalisationsQueryResult = Apollo.QueryResult<
  FetchAllLocalisationsQuery,
  FetchAllLocalisationsQueryVariables
>;
