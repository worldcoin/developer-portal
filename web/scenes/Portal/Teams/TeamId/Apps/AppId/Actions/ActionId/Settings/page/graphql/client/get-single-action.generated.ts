/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetSingleActionQueryVariables = Types.Exact<{
  action_id: Types.Scalars["String"]["input"];
}>;

export type GetSingleActionQuery = {
  __typename?: "query_root";
  action: Array<{
    __typename?: "action";
    id: string;
    app_id: string;
    action: string;
    description: string;
    name: string;
    max_verifications: number;
    app_flow_on_complete?: unknown | null;
    webhook_uri?: string | null;
    webhook_pem?: string | null;
    app: {
      __typename?: "app";
      id: string;
      is_staging: boolean;
      engine: string;
      app_metadata: Array<{ __typename?: "app_metadata"; app_mode: string }>;
    };
  }>;
};

export const GetSingleActionDocument = gql`
  query GetSingleAction($action_id: String!) {
    action(order_by: { created_at: asc }, where: { id: { _eq: $action_id } }) {
      id
      app_id
      action
      description
      name
      max_verifications
      app_flow_on_complete
      webhook_uri
      webhook_pem
      app {
        id
        is_staging
        engine
        app_metadata {
          app_mode
        }
      }
    }
  }
`;

/**
 * __useGetSingleActionQuery__
 *
 * To run a query within a React component, call `useGetSingleActionQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSingleActionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSingleActionQuery({
 *   variables: {
 *      action_id: // value for 'action_id'
 *   },
 * });
 */
export function useGetSingleActionQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetSingleActionQuery,
    GetSingleActionQueryVariables
  > &
    (
      | { variables: GetSingleActionQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetSingleActionQuery, GetSingleActionQueryVariables>(
    GetSingleActionDocument,
    options,
  );
}
export function useGetSingleActionLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetSingleActionQuery,
    GetSingleActionQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetSingleActionQuery,
    GetSingleActionQueryVariables
  >(GetSingleActionDocument, options);
}
export function useGetSingleActionSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetSingleActionQuery,
        GetSingleActionQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetSingleActionQuery,
    GetSingleActionQueryVariables
  >(GetSingleActionDocument, options);
}
export type GetSingleActionQueryHookResult = ReturnType<
  typeof useGetSingleActionQuery
>;
export type GetSingleActionLazyQueryHookResult = ReturnType<
  typeof useGetSingleActionLazyQuery
>;
export type GetSingleActionSuspenseQueryHookResult = ReturnType<
  typeof useGetSingleActionSuspenseQuery
>;
export type GetSingleActionQueryResult = Apollo.QueryResult<
  GetSingleActionQuery,
  GetSingleActionQueryVariables
>;
