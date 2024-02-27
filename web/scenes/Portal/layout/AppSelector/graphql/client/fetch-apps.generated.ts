/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type FetchAppsQueryVariables = Types.Exact<{
  teamId: Types.Scalars["String"];
}>;

export type FetchAppsQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    id: string;
    app_metadata: Array<{
      __typename?: "app_metadata";
      id: string;
      name: string;
    }>;
    verified_app_metadata: Array<{
      __typename?: "app_metadata";
      id: string;
      logo_img_url: string;
    }>;
  }>;
};

export const FetchAppsDocument = gql`
  query FetchApps($teamId: String!) {
    app(where: { team_id: { _eq: $teamId } }) {
      id
      app_metadata {
        id
        name
      }
      verified_app_metadata: app_metadata(
        where: { verification_status: { _eq: "verified" } }
      ) {
        id
        logo_img_url
      }
    }
  }
`;

/**
 * __useFetchAppsQuery__
 *
 * To run a query within a React component, call `useFetchAppsQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchAppsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchAppsQuery({
 *   variables: {
 *      teamId: // value for 'teamId'
 *   },
 * });
 */
export function useFetchAppsQuery(
  baseOptions: Apollo.QueryHookOptions<FetchAppsQuery, FetchAppsQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<FetchAppsQuery, FetchAppsQueryVariables>(
    FetchAppsDocument,
    options,
  );
}
export function useFetchAppsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    FetchAppsQuery,
    FetchAppsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<FetchAppsQuery, FetchAppsQueryVariables>(
    FetchAppsDocument,
    options,
  );
}
export type FetchAppsQueryHookResult = ReturnType<typeof useFetchAppsQuery>;
export type FetchAppsLazyQueryHookResult = ReturnType<
  typeof useFetchAppsLazyQuery
>;
export type FetchAppsQueryResult = Apollo.QueryResult<
  FetchAppsQuery,
  FetchAppsQueryVariables
>;
