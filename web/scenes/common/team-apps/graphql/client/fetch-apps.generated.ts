/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type FetchTeamAppsQueryVariables = Types.Exact<{
  teamId: Types.Scalars["String"]["input"];
}>;

export type FetchTeamAppsQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    id: string;
    is_staging: boolean;
    engine: string;
    app_metadata: Array<{
      __typename?: "app_metadata";
      id: string;
      name: string;
      logo_img_url: string;
      verification_status: string;
    }>;
  }>;
};

export const FetchTeamAppsDocument = gql`
  query FetchTeamApps($teamId: String!) {
    app(where: { team_id: { _eq: $teamId } }) {
      id
      is_staging
      engine
      app_metadata {
        id
        name
        logo_img_url
        verification_status
      }
    }
  }
`;

/**
 * __useFetchTeamAppsQuery__
 *
 * To run a query within a React component, call `useFetchTeamAppsQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchTeamAppsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchTeamAppsQuery({
 *   variables: {
 *      teamId: // value for 'teamId'
 *   },
 * });
 */
export function useFetchTeamAppsQuery(
  baseOptions: Apollo.QueryHookOptions<
    FetchTeamAppsQuery,
    FetchTeamAppsQueryVariables
  > &
    (
      | { variables: FetchTeamAppsQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<FetchTeamAppsQuery, FetchTeamAppsQueryVariables>(
    FetchTeamAppsDocument,
    options,
  );
}
export function useFetchTeamAppsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    FetchTeamAppsQuery,
    FetchTeamAppsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<FetchTeamAppsQuery, FetchTeamAppsQueryVariables>(
    FetchTeamAppsDocument,
    options,
  );
}
export function useFetchTeamAppsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        FetchTeamAppsQuery,
        FetchTeamAppsQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    FetchTeamAppsQuery,
    FetchTeamAppsQueryVariables
  >(FetchTeamAppsDocument, options);
}
export type FetchTeamAppsQueryHookResult = ReturnType<
  typeof useFetchTeamAppsQuery
>;
export type FetchTeamAppsLazyQueryHookResult = ReturnType<
  typeof useFetchTeamAppsLazyQuery
>;
export type FetchTeamAppsSuspenseQueryHookResult = ReturnType<
  typeof useFetchTeamAppsSuspenseQuery
>;
export type FetchTeamAppsQueryResult = Apollo.QueryResult<
  FetchTeamAppsQuery,
  FetchTeamAppsQueryVariables
>;
