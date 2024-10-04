/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type FetchMeQueryVariables = Types.Exact<{
  userId: Types.Scalars["String"]["input"];
}>;

export type FetchMeQuery = {
  __typename?: "query_root";
  user_by_pk?: {
    __typename?: "user";
    id: string;
    name: string;
    email?: string | null;
    world_id_nullifier?: string | null;
    posthog_id?: string | null;
    is_allow_tracking?: boolean | null;
    memberships: Array<{
      __typename?: "membership";
      role: Types.Role_Enum;
      team: { __typename?: "team"; id: string; name?: string | null };
    }>;
  } | null;
};

export const FetchMeDocument = gql`
  query FetchMe($userId: String!) {
    user_by_pk(id: $userId) {
      id
      name
      email
      world_id_nullifier
      posthog_id
      is_allow_tracking
      memberships {
        role
        team {
          id
          name
        }
      }
    }
  }
`;

/**
 * __useFetchMeQuery__
 *
 * To run a query within a React component, call `useFetchMeQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchMeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchMeQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useFetchMeQuery(
  baseOptions: Apollo.QueryHookOptions<FetchMeQuery, FetchMeQueryVariables> &
    ({ variables: FetchMeQueryVariables; skip?: boolean } | { skip: boolean }),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<FetchMeQuery, FetchMeQueryVariables>(
    FetchMeDocument,
    options,
  );
}
export function useFetchMeLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    FetchMeQuery,
    FetchMeQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<FetchMeQuery, FetchMeQueryVariables>(
    FetchMeDocument,
    options,
  );
}
export function useFetchMeSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<FetchMeQuery, FetchMeQueryVariables>,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<FetchMeQuery, FetchMeQueryVariables>(
    FetchMeDocument,
    options,
  );
}
export type FetchMeQueryHookResult = ReturnType<typeof useFetchMeQuery>;
export type FetchMeLazyQueryHookResult = ReturnType<typeof useFetchMeLazyQuery>;
export type FetchMeSuspenseQueryHookResult = ReturnType<
  typeof useFetchMeSuspenseQuery
>;
export type FetchMeQueryResult = Apollo.QueryResult<
  FetchMeQuery,
  FetchMeQueryVariables
>;
