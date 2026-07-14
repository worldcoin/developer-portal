/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetActionVerificationsFeedQueryVariables = Types.Exact<{
  action_id: Types.Scalars["String"]["input"];
  app_id: Types.Scalars["String"]["input"];
  limit: Types.Scalars["Int"]["input"];
  nullifier_where: Types.Nullifier_V4_Bool_Exp;
}>;

export type GetActionVerificationsFeedQuery = {
  __typename?: "query_root";
  action_v4: Array<{
    __typename?: "action_v4";
    id: string;
    action: string;
    description: string;
    nullifiers: Array<{
      __typename?: "nullifier_v4";
      id: string;
      created_at: string;
      nullifier: string;
    }>;
  }>;
};

export const GetActionVerificationsFeedDocument = gql`
  query GetActionVerificationsFeed(
    $action_id: String!
    $app_id: String!
    $limit: Int!
    $nullifier_where: nullifier_v4_bool_exp!
  ) {
    action_v4(
      where: {
        id: { _eq: $action_id }
        environment: { _eq: "production" }
        rp_registration: { app_id: { _eq: $app_id } }
      }
      limit: 1
    ) {
      id
      action
      description
      nullifiers(
        where: $nullifier_where
        limit: $limit
        order_by: [{ created_at: desc }, { id: desc }]
      ) {
        id
        created_at
        nullifier
      }
    }
  }
`;

/**
 * __useGetActionVerificationsFeedQuery__
 *
 * To run a query within a React component, call `useGetActionVerificationsFeedQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetActionVerificationsFeedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetActionVerificationsFeedQuery({
 *   variables: {
 *      action_id: // value for 'action_id'
 *      app_id: // value for 'app_id'
 *      limit: // value for 'limit'
 *      nullifier_where: // value for 'nullifier_where'
 *   },
 * });
 */
export function useGetActionVerificationsFeedQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetActionVerificationsFeedQuery,
    GetActionVerificationsFeedQueryVariables
  > &
    (
      | { variables: GetActionVerificationsFeedQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetActionVerificationsFeedQuery,
    GetActionVerificationsFeedQueryVariables
  >(GetActionVerificationsFeedDocument, options);
}
export function useGetActionVerificationsFeedLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetActionVerificationsFeedQuery,
    GetActionVerificationsFeedQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetActionVerificationsFeedQuery,
    GetActionVerificationsFeedQueryVariables
  >(GetActionVerificationsFeedDocument, options);
}
export function useGetActionVerificationsFeedSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetActionVerificationsFeedQuery,
        GetActionVerificationsFeedQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetActionVerificationsFeedQuery,
    GetActionVerificationsFeedQueryVariables
  >(GetActionVerificationsFeedDocument, options);
}
export type GetActionVerificationsFeedQueryHookResult = ReturnType<
  typeof useGetActionVerificationsFeedQuery
>;
export type GetActionVerificationsFeedLazyQueryHookResult = ReturnType<
  typeof useGetActionVerificationsFeedLazyQuery
>;
export type GetActionVerificationsFeedSuspenseQueryHookResult = ReturnType<
  typeof useGetActionVerificationsFeedSuspenseQuery
>;
export type GetActionVerificationsFeedQueryResult = Apollo.QueryResult<
  GetActionVerificationsFeedQuery,
  GetActionVerificationsFeedQueryVariables
>;
