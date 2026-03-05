/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type FetchNotificationAppMetadataQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type FetchNotificationAppMetadataQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    id: string;
    app_metadata: Array<{
      __typename?: "app_metadata";
      id: string;
      verification_status: string;
    }>;
    verified_app_metadata: Array<{
      __typename?: "app_metadata";
      id: string;
      verified_at?: string | null;
    }>;
  }>;
};

export const FetchNotificationAppMetadataDocument = gql`
  query FetchNotificationAppMetadata($id: String!) {
    app(where: { id: { _eq: $id } }) {
      id
      app_metadata(where: { verification_status: { _neq: "verified" } }) {
        id
        verification_status
      }
      verified_app_metadata: app_metadata(
        where: { verification_status: { _eq: "verified" } }
      ) {
        id
        verified_at
      }
    }
  }
`;

/**
 * __useFetchNotificationAppMetadataQuery__
 *
 * To run a query within a React component, call `useFetchNotificationAppMetadataQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchNotificationAppMetadataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchNotificationAppMetadataQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useFetchNotificationAppMetadataQuery(
  baseOptions: Apollo.QueryHookOptions<
    FetchNotificationAppMetadataQuery,
    FetchNotificationAppMetadataQueryVariables
  > &
    (
      | {
          variables: FetchNotificationAppMetadataQueryVariables;
          skip?: boolean;
        }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    FetchNotificationAppMetadataQuery,
    FetchNotificationAppMetadataQueryVariables
  >(FetchNotificationAppMetadataDocument, options);
}
export function useFetchNotificationAppMetadataLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    FetchNotificationAppMetadataQuery,
    FetchNotificationAppMetadataQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    FetchNotificationAppMetadataQuery,
    FetchNotificationAppMetadataQueryVariables
  >(FetchNotificationAppMetadataDocument, options);
}
export function useFetchNotificationAppMetadataSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        FetchNotificationAppMetadataQuery,
        FetchNotificationAppMetadataQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    FetchNotificationAppMetadataQuery,
    FetchNotificationAppMetadataQueryVariables
  >(FetchNotificationAppMetadataDocument, options);
}
export type FetchNotificationAppMetadataQueryHookResult = ReturnType<
  typeof useFetchNotificationAppMetadataQuery
>;
export type FetchNotificationAppMetadataLazyQueryHookResult = ReturnType<
  typeof useFetchNotificationAppMetadataLazyQuery
>;
export type FetchNotificationAppMetadataSuspenseQueryHookResult = ReturnType<
  typeof useFetchNotificationAppMetadataSuspenseQuery
>;
export type FetchNotificationAppMetadataQueryResult = Apollo.QueryResult<
  FetchNotificationAppMetadataQuery,
  FetchNotificationAppMetadataQueryVariables
>;
