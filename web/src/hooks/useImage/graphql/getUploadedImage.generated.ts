/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetUploadedImageQueryQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"];
  image_type: Types.Scalars["String"];
  content_type_ending: Types.Scalars["String"];
}>;

export type GetUploadedImageQueryQuery = {
  __typename?: "query_root";
  get_uploaded_image?: {
    __typename?: "GetUploadedImageOutput";
    url: string;
  } | null;
};

export const GetUploadedImageQueryDocument = gql`
  query GetUploadedImageQuery(
    $app_id: String!
    $image_type: String!
    $content_type_ending: String!
  ) {
    get_uploaded_image(
      app_id: $app_id
      image_type: $image_type
      content_type_ending: $content_type_ending
    ) {
      url
    }
  }
`;

/**
 * __useGetUploadedImageQueryQuery__
 *
 * To run a query within a React component, call `useGetUploadedImageQueryQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUploadedImageQueryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUploadedImageQueryQuery({
 *   variables: {
 *      app_id: // value for 'app_id'
 *      image_type: // value for 'image_type'
 *      content_type_ending: // value for 'content_type_ending'
 *   },
 * });
 */
export function useGetUploadedImageQueryQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetUploadedImageQueryQuery,
    GetUploadedImageQueryQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetUploadedImageQueryQuery,
    GetUploadedImageQueryQueryVariables
  >(GetUploadedImageQueryDocument, options);
}
export function useGetUploadedImageQueryLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetUploadedImageQueryQuery,
    GetUploadedImageQueryQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetUploadedImageQueryQuery,
    GetUploadedImageQueryQueryVariables
  >(GetUploadedImageQueryDocument, options);
}
export type GetUploadedImageQueryQueryHookResult = ReturnType<
  typeof useGetUploadedImageQueryQuery
>;
export type GetUploadedImageQueryLazyQueryHookResult = ReturnType<
  typeof useGetUploadedImageQueryLazyQuery
>;
export type GetUploadedImageQueryQueryResult = Apollo.QueryResult<
  GetUploadedImageQueryQuery,
  GetUploadedImageQueryQueryVariables
>;
