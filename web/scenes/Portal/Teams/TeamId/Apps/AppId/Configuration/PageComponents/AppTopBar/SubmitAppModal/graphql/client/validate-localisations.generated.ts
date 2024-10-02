/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type ValidateLocalisationQueryVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"];
  team_id: Types.Scalars["String"];
}>;

export type ValidateLocalisationQuery = {
  __typename?: "query_root";
  validate_localisation?: {
    __typename?: "ValidateLocalisationOutput";
    success?: boolean | null;
  } | null;
};

export const ValidateLocalisationDocument = gql`
  query ValidateLocalisation($app_metadata_id: String!, $team_id: String!) {
    validate_localisation(
      app_metadata_id: $app_metadata_id
      team_id: $team_id
    ) {
      success
    }
  }
`;

/**
 * __useValidateLocalisationQuery__
 *
 * To run a query within a React component, call `useValidateLocalisationQuery` and pass it any options that fit your needs.
 * When your component renders, `useValidateLocalisationQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useValidateLocalisationQuery({
 *   variables: {
 *      app_metadata_id: // value for 'app_metadata_id'
 *      team_id: // value for 'team_id'
 *   },
 * });
 */
export function useValidateLocalisationQuery(
  baseOptions: Apollo.QueryHookOptions<
    ValidateLocalisationQuery,
    ValidateLocalisationQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ValidateLocalisationQuery,
    ValidateLocalisationQueryVariables
  >(ValidateLocalisationDocument, options);
}
export function useValidateLocalisationLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ValidateLocalisationQuery,
    ValidateLocalisationQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ValidateLocalisationQuery,
    ValidateLocalisationQueryVariables
  >(ValidateLocalisationDocument, options);
}
export type ValidateLocalisationQueryHookResult = ReturnType<
  typeof useValidateLocalisationQuery
>;
export type ValidateLocalisationLazyQueryHookResult = ReturnType<
  typeof useValidateLocalisationLazyQuery
>;
export type ValidateLocalisationQueryResult = Apollo.QueryResult<
  ValidateLocalisationQuery,
  ValidateLocalisationQueryVariables
>;
