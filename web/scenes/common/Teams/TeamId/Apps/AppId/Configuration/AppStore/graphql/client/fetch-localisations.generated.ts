/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type FetchLocalisationsQueryVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
}>;

export type FetchLocalisationsQuery = {
  __typename?: "query_root";
  localisations: Array<{
    __typename?: "localisations";
    locale: string;
    name: string;
    description: string;
    world_app_button_text: string;
    world_app_description: string;
    short_name: string;
    hero_image_url: string;
    meta_tag_image_url: string;
    showcase_img_urls?: Array<string> | null;
  }>;
};

export const FetchLocalisationsDocument = gql`
  query FetchLocalisations($app_metadata_id: String!) {
    localisations(where: { app_metadata_id: { _eq: $app_metadata_id } }) {
      locale
      name
      description
      world_app_button_text
      world_app_description
      short_name
      hero_image_url
      meta_tag_image_url
      showcase_img_urls
    }
  }
`;

/**
 * __useFetchLocalisationsQuery__
 *
 * To run a query within a React component, call `useFetchLocalisationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchLocalisationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchLocalisationsQuery({
 *   variables: {
 *      app_metadata_id: // value for 'app_metadata_id'
 *   },
 * });
 */
export function useFetchLocalisationsQuery(
  baseOptions: Apollo.QueryHookOptions<
    FetchLocalisationsQuery,
    FetchLocalisationsQueryVariables
  > &
    (
      | { variables: FetchLocalisationsQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    FetchLocalisationsQuery,
    FetchLocalisationsQueryVariables
  >(FetchLocalisationsDocument, options);
}
export function useFetchLocalisationsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    FetchLocalisationsQuery,
    FetchLocalisationsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    FetchLocalisationsQuery,
    FetchLocalisationsQueryVariables
  >(FetchLocalisationsDocument, options);
}
export function useFetchLocalisationsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        FetchLocalisationsQuery,
        FetchLocalisationsQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    FetchLocalisationsQuery,
    FetchLocalisationsQueryVariables
  >(FetchLocalisationsDocument, options);
}
export type FetchLocalisationsQueryHookResult = ReturnType<
  typeof useFetchLocalisationsQuery
>;
export type FetchLocalisationsLazyQueryHookResult = ReturnType<
  typeof useFetchLocalisationsLazyQuery
>;
export type FetchLocalisationsSuspenseQueryHookResult = ReturnType<
  typeof useFetchLocalisationsSuspenseQuery
>;
export type FetchLocalisationsQueryResult = Apollo.QueryResult<
  FetchLocalisationsQuery,
  FetchLocalisationsQueryVariables
>;
