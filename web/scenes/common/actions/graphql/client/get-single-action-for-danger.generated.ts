/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetSingleActionForDangerQueryVariables = Types.Exact<{
  action_id: Types.Scalars["String"]["input"];
}>;

export type GetSingleActionForDangerQuery = {
  __typename?: "query_root";
  action_by_pk?: {
    __typename?: "action";
    id: string;
    name: string;
    app_id: string;
    app: {
      __typename?: "app";
      id: string;
      rp_registration: Array<{ __typename?: "rp_registration"; rp_id: string }>;
    };
  } | null;
};

export const GetSingleActionForDangerDocument = gql`
  query GetSingleActionForDanger($action_id: String!) {
    action_by_pk(id: $action_id) {
      id
      name
      app_id
      app {
        id
        rp_registration {
          rp_id
        }
      }
    }
  }
`;

/**
 * __useGetSingleActionForDangerQuery__
 *
 * To run a query within a React component, call `useGetSingleActionForDangerQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSingleActionForDangerQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSingleActionForDangerQuery({
 *   variables: {
 *      action_id: // value for 'action_id'
 *   },
 * });
 */
export function useGetSingleActionForDangerQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetSingleActionForDangerQuery,
    GetSingleActionForDangerQueryVariables
  > &
    (
      | { variables: GetSingleActionForDangerQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetSingleActionForDangerQuery, GetSingleActionForDangerQueryVariables>(
    GetSingleActionForDangerDocument,
    options,
  );
}
export function useGetSingleActionForDangerLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetSingleActionForDangerQuery,
    GetSingleActionForDangerQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetSingleActionForDangerQuery,
    GetSingleActionForDangerQueryVariables
  >(GetSingleActionForDangerDocument, options);
}
export function useGetSingleActionForDangerSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetSingleActionForDangerQuery,
        GetSingleActionForDangerQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetSingleActionForDangerQuery,
    GetSingleActionForDangerQueryVariables
  >(GetSingleActionForDangerDocument, options);
}
export type GetSingleActionForDangerQueryHookResult = ReturnType<
  typeof useGetSingleActionForDangerQuery
>;
export type GetSingleActionForDangerLazyQueryHookResult = ReturnType<
  typeof useGetSingleActionForDangerLazyQuery
>;
export type GetSingleActionForDangerSuspenseQueryHookResult = ReturnType<
  typeof useGetSingleActionForDangerSuspenseQuery
>;
export type GetSingleActionForDangerQueryResult = Apollo.QueryResult<
  GetSingleActionForDangerQuery,
  GetSingleActionForDangerQueryVariables
>;
