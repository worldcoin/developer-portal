/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UploadImageQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  image_type: Types.Scalars["String"]["input"];
  content_type_ending: Types.Scalars["String"]["input"];
  team_id: Types.Scalars["String"]["input"];
  locale?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type UploadImageQuery = {
  __typename?: "query_root";
  upload_image?: {
    __typename?: "PresignedPostOutput";
    url: string;
    stringifiedFields: string;
  } | null;
};

export const UploadImageDocument = gql`
  query UploadImage(
    $app_id: String!
    $image_type: String!
    $content_type_ending: String!
    $team_id: String!
    $locale: String
  ) {
    upload_image(
      app_id: $app_id
      image_type: $image_type
      content_type_ending: $content_type_ending
      team_id: $team_id
      locale: $locale
    ) {
      url
      stringifiedFields
    }
  }
`;

/**
 * __useUploadImageQuery__
 *
 * To run a query within a React component, call `useUploadImageQuery` and pass it any options that fit your needs.
 * When your component renders, `useUploadImageQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUploadImageQuery({
 *   variables: {
 *      app_id: // value for 'app_id'
 *      image_type: // value for 'image_type'
 *      content_type_ending: // value for 'content_type_ending'
 *      team_id: // value for 'team_id'
 *      locale: // value for 'locale'
 *   },
 * });
 */
export function useUploadImageQuery(
  baseOptions: Apollo.QueryHookOptions<
    UploadImageQuery,
    UploadImageQueryVariables
  > &
    (
      | { variables: UploadImageQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<UploadImageQuery, UploadImageQueryVariables>(
    UploadImageDocument,
    options,
  );
}
export function useUploadImageLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    UploadImageQuery,
    UploadImageQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<UploadImageQuery, UploadImageQueryVariables>(
    UploadImageDocument,
    options,
  );
}
export function useUploadImageSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        UploadImageQuery,
        UploadImageQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<UploadImageQuery, UploadImageQueryVariables>(
    UploadImageDocument,
    options,
  );
}
export type UploadImageQueryHookResult = ReturnType<typeof useUploadImageQuery>;
export type UploadImageLazyQueryHookResult = ReturnType<
  typeof useUploadImageLazyQuery
>;
export type UploadImageSuspenseQueryHookResult = ReturnType<
  typeof useUploadImageSuspenseQuery
>;
export type UploadImageQueryResult = Apollo.QueryResult<
  UploadImageQuery,
  UploadImageQueryVariables
>;
