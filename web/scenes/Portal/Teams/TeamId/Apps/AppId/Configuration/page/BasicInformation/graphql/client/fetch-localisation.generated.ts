/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type FetchLocalisationQueryVariables = Types.Exact<{
  id: Types.Scalars["String"];
  locale: Types.Scalars["String"];
}>;

export type FetchLocalisationQuery = {
  __typename?: "query_root";
  localisations: Array<{
    __typename?: "localisations";
    id: string;
    app_metadata_id: string;
    locale: string;
    name: string;
    description: string;
    world_app_button_text: string;
    world_app_description: string;
    short_name: string;
  }>;
};

export const FetchLocalisationDocument = gql`
  query FetchLocalisation($id: String!, $locale: String!) {
    localisations(
      where: { app_metadata_id: { _eq: $id }, locale: { _eq: $locale } }
    ) {
      id
      app_metadata_id
      locale
      name
      description
      world_app_button_text
      world_app_description
      short_name
    }
  }
`;

/**
 * __useFetchLocalisationQuery__
 *
 * To run a query within a React component, call `useFetchLocalisationQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchLocalisationQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchLocalisationQuery({
 *   variables: {
 *      id: // value for 'id'
 *      locale: // value for 'locale'
 *   },
 * });
 */
export function useFetchLocalisationQuery(
  baseOptions: Apollo.QueryHookOptions<
    FetchLocalisationQuery,
    FetchLocalisationQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    FetchLocalisationQuery,
    FetchLocalisationQueryVariables
  >(FetchLocalisationDocument, options);
}
export function useFetchLocalisationLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    FetchLocalisationQuery,
    FetchLocalisationQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    FetchLocalisationQuery,
    FetchLocalisationQueryVariables
  >(FetchLocalisationDocument, options);
}
export type FetchLocalisationQueryHookResult = ReturnType<
  typeof useFetchLocalisationQuery
>;
export type FetchLocalisationLazyQueryHookResult = ReturnType<
  typeof useFetchLocalisationLazyQuery
>;
export type FetchLocalisationQueryResult = Apollo.QueryResult<
  FetchLocalisationQuery,
  FetchLocalisationQueryVariables
>;
