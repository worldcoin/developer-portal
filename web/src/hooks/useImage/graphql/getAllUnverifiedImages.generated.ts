/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetAllUnverifiedImagesQueryQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"];
}>;

export type GetAllUnverifiedImagesQueryQuery = {
  __typename?: "query_root";
  get_all_unverified_images?: {
    __typename?: "ImageGetAllUnverifiedImagesOutput";
    logo_img_url?: string | null;
    hero_image_url?: string | null;
    showcase_img_urls?: Array<string | null> | null;
  } | null;
};

export const GetAllUnverifiedImagesQueryDocument = gql`
  query GetAllUnverifiedImagesQuery($app_id: String!) {
    get_all_unverified_images(app_id: $app_id) {
      logo_img_url
      hero_image_url
      showcase_img_urls
    }
  }
`;

/**
 * __useGetAllUnverifiedImagesQueryQuery__
 *
 * To run a query within a React component, call `useGetAllUnverifiedImagesQueryQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAllUnverifiedImagesQueryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAllUnverifiedImagesQueryQuery({
 *   variables: {
 *      app_id: // value for 'app_id'
 *   },
 * });
 */
export function useGetAllUnverifiedImagesQueryQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetAllUnverifiedImagesQueryQuery,
    GetAllUnverifiedImagesQueryQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetAllUnverifiedImagesQueryQuery,
    GetAllUnverifiedImagesQueryQueryVariables
  >(GetAllUnverifiedImagesQueryDocument, options);
}
export function useGetAllUnverifiedImagesQueryLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetAllUnverifiedImagesQueryQuery,
    GetAllUnverifiedImagesQueryQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetAllUnverifiedImagesQueryQuery,
    GetAllUnverifiedImagesQueryQueryVariables
  >(GetAllUnverifiedImagesQueryDocument, options);
}
export type GetAllUnverifiedImagesQueryQueryHookResult = ReturnType<
  typeof useGetAllUnverifiedImagesQueryQuery
>;
export type GetAllUnverifiedImagesQueryLazyQueryHookResult = ReturnType<
  typeof useGetAllUnverifiedImagesQueryLazyQuery
>;
export type GetAllUnverifiedImagesQueryQueryResult = Apollo.QueryResult<
  GetAllUnverifiedImagesQueryQuery,
  GetAllUnverifiedImagesQueryQueryVariables
>;
