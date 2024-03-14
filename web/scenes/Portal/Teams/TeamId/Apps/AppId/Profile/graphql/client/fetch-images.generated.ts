/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type FetchImagesQueryVariables = Types.Exact<{
  id: Types.Scalars["String"];
  team_id: Types.Scalars["String"];
}>;

export type FetchImagesQuery = {
  __typename?: "query_root";
  unverified_images?: {
    __typename?: "ImageGetAllUnverifiedImagesOutput";
    logo_img_url?: string | null;
    hero_image_url?: string | null;
    showcase_img_urls?: Array<string> | null;
  } | null;
};

export const FetchImagesDocument = gql`
  query FetchImages($id: String!, $team_id: String!) {
    unverified_images: get_all_unverified_images(
      app_id: $id
      team_id: $team_id
    ) {
      logo_img_url
      hero_image_url
      showcase_img_urls
    }
  }
`;

/**
 * __useFetchImagesQuery__
 *
 * To run a query within a React component, call `useFetchImagesQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchImagesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchImagesQuery({
 *   variables: {
 *      id: // value for 'id'
 *      team_id: // value for 'team_id'
 *   },
 * });
 */
export function useFetchImagesQuery(
  baseOptions: Apollo.QueryHookOptions<
    FetchImagesQuery,
    FetchImagesQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<FetchImagesQuery, FetchImagesQueryVariables>(
    FetchImagesDocument,
    options,
  );
}
export function useFetchImagesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    FetchImagesQuery,
    FetchImagesQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<FetchImagesQuery, FetchImagesQueryVariables>(
    FetchImagesDocument,
    options,
  );
}
export type FetchImagesQueryHookResult = ReturnType<typeof useFetchImagesQuery>;
export type FetchImagesLazyQueryHookResult = ReturnType<
  typeof useFetchImagesLazyQuery
>;
export type FetchImagesQueryResult = Apollo.QueryResult<
  FetchImagesQuery,
  FetchImagesQueryVariables
>;

