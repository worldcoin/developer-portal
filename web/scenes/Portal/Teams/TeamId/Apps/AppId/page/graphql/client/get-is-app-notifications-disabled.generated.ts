/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetIsAppNotificationsDisabledQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
}>;

export type GetIsAppNotificationsDisabledQuery = {
  __typename?: "query_root";
  app: Array<{ __typename?: "app_metadata"; id: string }>;
};

export const GetIsAppNotificationsDisabledDocument = gql`
  query GetIsAppNotificationsDisabled($app_id: String!) {
    app: app_metadata(
      where: {
        app_id: { _eq: $app_id }
        notification_permission_status: { _neq: "normal" }
      }
    ) {
      id
    }
  }
`;

/**
 * __useGetIsAppNotificationsDisabledQuery__
 *
 * To run a query within a React component, call `useGetIsAppNotificationsDisabledQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetIsAppNotificationsDisabledQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetIsAppNotificationsDisabledQuery({
 *   variables: {
 *      app_id: // value for 'app_id'
 *   },
 * });
 */
export function useGetIsAppNotificationsDisabledQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetIsAppNotificationsDisabledQuery,
    GetIsAppNotificationsDisabledQueryVariables
  > &
    (
      | {
          variables: GetIsAppNotificationsDisabledQueryVariables;
          skip?: boolean;
        }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetIsAppNotificationsDisabledQuery,
    GetIsAppNotificationsDisabledQueryVariables
  >(GetIsAppNotificationsDisabledDocument, options);
}
export function useGetIsAppNotificationsDisabledLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetIsAppNotificationsDisabledQuery,
    GetIsAppNotificationsDisabledQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetIsAppNotificationsDisabledQuery,
    GetIsAppNotificationsDisabledQueryVariables
  >(GetIsAppNotificationsDisabledDocument, options);
}
export function useGetIsAppNotificationsDisabledSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetIsAppNotificationsDisabledQuery,
        GetIsAppNotificationsDisabledQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetIsAppNotificationsDisabledQuery,
    GetIsAppNotificationsDisabledQueryVariables
  >(GetIsAppNotificationsDisabledDocument, options);
}
export type GetIsAppNotificationsDisabledQueryHookResult = ReturnType<
  typeof useGetIsAppNotificationsDisabledQuery
>;
export type GetIsAppNotificationsDisabledLazyQueryHookResult = ReturnType<
  typeof useGetIsAppNotificationsDisabledLazyQuery
>;
export type GetIsAppNotificationsDisabledSuspenseQueryHookResult = ReturnType<
  typeof useGetIsAppNotificationsDisabledSuspenseQuery
>;
export type GetIsAppNotificationsDisabledQueryResult = Apollo.QueryResult<
  GetIsAppNotificationsDisabledQuery,
  GetIsAppNotificationsDisabledQueryVariables
>;
