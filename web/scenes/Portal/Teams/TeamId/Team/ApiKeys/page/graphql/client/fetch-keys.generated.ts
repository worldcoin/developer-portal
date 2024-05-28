/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type FetchKeysQueryVariables = Types.Exact<{
  teamId: Types.Scalars["String"];
}>;

export type FetchKeysQuery = {
  __typename?: "query_root";
  api_key: Array<{
    __typename?: "api_key";
    id: string;
    team_id: string;
    created_at: any;
    updated_at: any;
    is_active: boolean;
    name: string;
  }>;
};

export const FetchKeysDocument = gql`
  query FetchKeys($teamId: String!) {
    api_key(
      order_by: { created_at: asc }
      where: { team_id: { _eq: $teamId } }
    ) {
      id
      team_id
      created_at
      updated_at
      is_active
      name
    }
  }
`;

/**
 * __useFetchKeysQuery__
 *
 * To run a query within a React component, call `useFetchKeysQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchKeysQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchKeysQuery({
 *   variables: {
 *      teamId: // value for 'teamId'
 *   },
 * });
 */
export function useFetchKeysQuery(
  baseOptions: Apollo.QueryHookOptions<FetchKeysQuery, FetchKeysQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<FetchKeysQuery, FetchKeysQueryVariables>(
    FetchKeysDocument,
    options,
  );
}
export function useFetchKeysLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    FetchKeysQuery,
    FetchKeysQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<FetchKeysQuery, FetchKeysQueryVariables>(
    FetchKeysDocument,
    options,
  );
}
export type FetchKeysQueryHookResult = ReturnType<typeof useFetchKeysQuery>;
export type FetchKeysLazyQueryHookResult = ReturnType<
  typeof useFetchKeysLazyQuery
>;
export type FetchKeysQueryResult = Apollo.QueryResult<
  FetchKeysQuery,
  FetchKeysQueryVariables
>;
