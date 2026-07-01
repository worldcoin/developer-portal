/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetVerificationDataQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type GetVerificationDataQuery = {
  __typename?: "query_root";
  app?: {
    __typename?: "app";
    id: string;
    app_metadata: Array<{
      __typename?: "app_metadata";
      id: string;
      review_message: string;
      verification_status: string;
    }>;
  } | null;
};

export const GetVerificationDataDocument = gql`
  query GetVerificationData($id: String!) {
    app: app_by_pk(id: $id) {
      id
      app_metadata(
        where: {
          _or: [
            { verification_status: { _eq: "changes_requested" } }
            { verification_status: { _eq: "verified" } }
          ]
        }
      ) {
        id
        review_message
        verification_status
      }
    }
  }
`;

/**
 * __useGetVerificationDataQuery__
 *
 * To run a query within a React component, call `useGetVerificationDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetVerificationDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetVerificationDataQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetVerificationDataQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetVerificationDataQuery,
    GetVerificationDataQueryVariables
  > &
    (
      | { variables: GetVerificationDataQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetVerificationDataQuery,
    GetVerificationDataQueryVariables
  >(GetVerificationDataDocument, options);
}
export function useGetVerificationDataLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetVerificationDataQuery,
    GetVerificationDataQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetVerificationDataQuery,
    GetVerificationDataQueryVariables
  >(GetVerificationDataDocument, options);
}
export function useGetVerificationDataSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetVerificationDataQuery,
        GetVerificationDataQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetVerificationDataQuery,
    GetVerificationDataQueryVariables
  >(GetVerificationDataDocument, options);
}
export type GetVerificationDataQueryHookResult = ReturnType<
  typeof useGetVerificationDataQuery
>;
export type GetVerificationDataLazyQueryHookResult = ReturnType<
  typeof useGetVerificationDataLazyQuery
>;
export type GetVerificationDataSuspenseQueryHookResult = ReturnType<
  typeof useGetVerificationDataSuspenseQuery
>;
export type GetVerificationDataQueryResult = Apollo.QueryResult<
  GetVerificationDataQuery,
  GetVerificationDataQueryVariables
>;
