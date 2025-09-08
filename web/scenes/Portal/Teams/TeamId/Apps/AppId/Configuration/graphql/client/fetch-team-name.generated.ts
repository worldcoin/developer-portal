/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type FetchTeamNameQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type FetchTeamNameQuery = {
  __typename?: "query_root";
  team: Array<{ __typename?: "team"; name?: string | null }>;
};

export const FetchTeamNameDocument = gql`
  query FetchTeamName($id: String!) {
    team(where: { id: { _eq: $id }, deleted_at: { _is_null: true } }) {
      name
    }
  }
`;

/**
 * __useFetchTeamNameQuery__
 *
 * To run a query within a React component, call `useFetchTeamNameQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchTeamNameQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchTeamNameQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useFetchTeamNameQuery(
  baseOptions: Apollo.QueryHookOptions<
    FetchTeamNameQuery,
    FetchTeamNameQueryVariables
  > &
    (
      | { variables: FetchTeamNameQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<FetchTeamNameQuery, FetchTeamNameQueryVariables>(
    FetchTeamNameDocument,
    options,
  );
}
export function useFetchTeamNameLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    FetchTeamNameQuery,
    FetchTeamNameQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<FetchTeamNameQuery, FetchTeamNameQueryVariables>(
    FetchTeamNameDocument,
    options,
  );
}
export function useFetchTeamNameSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        FetchTeamNameQuery,
        FetchTeamNameQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    FetchTeamNameQuery,
    FetchTeamNameQueryVariables
  >(FetchTeamNameDocument, options);
}
export type FetchTeamNameQueryHookResult = ReturnType<
  typeof useFetchTeamNameQuery
>;
export type FetchTeamNameLazyQueryHookResult = ReturnType<
  typeof useFetchTeamNameLazyQuery
>;
export type FetchTeamNameSuspenseQueryHookResult = ReturnType<
  typeof useFetchTeamNameSuspenseQuery
>;
export type FetchTeamNameQueryResult = Apollo.QueryResult<
  FetchTeamNameQuery,
  FetchTeamNameQueryVariables
>;
