/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetUploadedImageQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  image_type: Types.Scalars["String"]["input"];
  content_type_ending: Types.Scalars["String"]["input"];
  team_id: Types.Scalars["String"]["input"];
}>;

export type GetUploadedImageQuery = {
  __typename?: "query_root";
  get_uploaded_image?: {
    __typename?: "GetUploadedImageOutput";
    url: string;
  } | null;
};

export const GetUploadedImageDocument = gql`
  query GetUploadedImage(
    $app_id: String!
    $image_type: String!
    $content_type_ending: String!
    $team_id: String!
  ) {
    get_uploaded_image(
      app_id: $app_id
      image_type: $image_type
      content_type_ending: $content_type_ending
      team_id: $team_id
    ) {
      url
    }
  }
`;

/**
 * __useGetUploadedImageQuery__
 *
 * To run a query within a React component, call `useGetUploadedImageQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUploadedImageQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUploadedImageQuery({
 *   variables: {
 *      app_id: // value for 'app_id'
 *      image_type: // value for 'image_type'
 *      content_type_ending: // value for 'content_type_ending'
 *      team_id: // value for 'team_id'
 *   },
 * });
 */
export function useGetUploadedImageQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetUploadedImageQuery,
    GetUploadedImageQueryVariables
  > &
    (
      | { variables: GetUploadedImageQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetUploadedImageQuery, GetUploadedImageQueryVariables>(
    GetUploadedImageDocument,
    options,
  );
}
export function useGetUploadedImageLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetUploadedImageQuery,
    GetUploadedImageQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetUploadedImageQuery,
    GetUploadedImageQueryVariables
  >(GetUploadedImageDocument, options);
}
export function useGetUploadedImageSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetUploadedImageQuery,
        GetUploadedImageQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetUploadedImageQuery,
    GetUploadedImageQueryVariables
  >(GetUploadedImageDocument, options);
}
export type GetUploadedImageQueryHookResult = ReturnType<
  typeof useGetUploadedImageQuery
>;
export type GetUploadedImageLazyQueryHookResult = ReturnType<
  typeof useGetUploadedImageLazyQuery
>;
export type GetUploadedImageSuspenseQueryHookResult = ReturnType<
  typeof useGetUploadedImageSuspenseQuery
>;
export type GetUploadedImageQueryResult = Apollo.QueryResult<
  GetUploadedImageQuery,
  GetUploadedImageQueryVariables
>;
