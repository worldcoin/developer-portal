/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetActionsQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  condition?: Types.InputMaybe<
    Array<Types.Action_Bool_Exp> | Types.Action_Bool_Exp
  >;
}>;

export type GetActionsQuery = {
  __typename?: "query_root";
  actions: Array<{
    __typename?: "action";
    id: string;
    app_id: string;
    action: string;
    created_at: string;
    creation_mode: string;
    description: string;
    external_nullifier: string;
    kiosk_enabled: boolean;
    name: string;
    max_accounts_per_user: number;
    max_verifications: number;
    app_flow_on_complete?: unknown | null;
    webhook_uri?: string | null;
    webhook_pem?: string | null;
    post_action_deep_link_ios?: string | null;
    post_action_deep_link_android?: string | null;
    updated_at: string;
    nullifiers: {
      __typename?: "nullifier_aggregate";
      aggregate?: {
        __typename?: "nullifier_aggregate_fields";
        sum?: {
          __typename?: "nullifier_sum_fields";
          uses?: number | null;
        } | null;
      } | null;
    };
  }>;
};

export const GetActionsDocument = gql`
  query GetActions($app_id: String!, $condition: [action_bool_exp!]) {
    actions: action(
      order_by: { created_at: asc }
      where: { app_id: { _eq: $app_id }, action: { _neq: "" }, _or: $condition }
    ) {
      id
      app_id
      action
      created_at
      creation_mode
      description
      external_nullifier
      kiosk_enabled
      name
      max_accounts_per_user
      max_verifications
      app_flow_on_complete
      webhook_uri
      webhook_pem
      post_action_deep_link_ios
      post_action_deep_link_android
      updated_at
      nullifiers: nullifiers_aggregate {
        aggregate {
          sum {
            uses
          }
        }
      }
    }
  }
`;

/**
 * __useGetActionsQuery__
 *
 * To run a query within a React component, call `useGetActionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetActionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetActionsQuery({
 *   variables: {
 *      app_id: // value for 'app_id'
 *      condition: // value for 'condition'
 *   },
 * });
 */
export function useGetActionsQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetActionsQuery,
    GetActionsQueryVariables
  > &
    (
      | { variables: GetActionsQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetActionsQuery, GetActionsQueryVariables>(
    GetActionsDocument,
    options,
  );
}
export function useGetActionsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetActionsQuery,
    GetActionsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetActionsQuery, GetActionsQueryVariables>(
    GetActionsDocument,
    options,
  );
}
export function useGetActionsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetActionsQuery,
        GetActionsQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetActionsQuery, GetActionsQueryVariables>(
    GetActionsDocument,
    options,
  );
}
export type GetActionsQueryHookResult = ReturnType<typeof useGetActionsQuery>;
export type GetActionsLazyQueryHookResult = ReturnType<
  typeof useGetActionsLazyQuery
>;
export type GetActionsSuspenseQueryHookResult = ReturnType<
  typeof useGetActionsSuspenseQuery
>;
export type GetActionsQueryResult = Apollo.QueryResult<
  GetActionsQuery,
  GetActionsQueryVariables
>;
