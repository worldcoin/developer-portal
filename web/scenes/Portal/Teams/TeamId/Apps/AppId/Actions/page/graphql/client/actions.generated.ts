/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetActionsQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"];
}>;

export type GetActionsQuery = {
  __typename?: "query_root";
  action: Array<{
    __typename?: "action";
    id: string;
    app_id: string;
    action: string;
    created_at: any;
    creation_mode: string;
    description: string;
    external_nullifier: string;
    kiosk_enabled: boolean;
    name: string;
    max_accounts_per_user: number;
    max_verifications: number;
    updated_at: any;
    nullifiers: Array<{
      __typename?: "nullifier";
      id: string;
      created_at: any;
      nullifier_hash: string;
      uses?: number | null;
    }>;
  }>;
  app: Array<{
    __typename?: "app";
    id: string;
    engine: string;
    app_metadata: Array<{
      __typename?: "app_metadata";
      id: string;
      name: string;
    }>;
  }>;
};

export const GetActionsDocument = gql`
  query GetActions($app_id: String!) {
    action(
      order_by: { created_at: asc }
      where: { app_id: { _eq: $app_id }, action: { _neq: "" } }
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
      updated_at
      nullifiers {
        id
        created_at
        nullifier_hash
        uses
      }
    }
    app(where: { id: { _eq: $app_id } }) {
      id
      engine
      app_metadata {
        id
        name
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
 *   },
 * });
 */
export function useGetActionsQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetActionsQuery,
    GetActionsQueryVariables
  >,
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
export type GetActionsQueryHookResult = ReturnType<typeof useGetActionsQuery>;
export type GetActionsLazyQueryHookResult = ReturnType<
  typeof useGetActionsLazyQuery
>;
export type GetActionsQueryResult = Apollo.QueryResult<
  GetActionsQuery,
  GetActionsQueryVariables
>;
