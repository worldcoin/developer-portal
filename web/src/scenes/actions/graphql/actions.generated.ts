/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type ActionsQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"];
}>;

export type ActionsQuery = {
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
      credential_type: string;
      uses?: number | null;
    }>;
  }>;
};

export const ActionsDocument = gql`
  query Actions($app_id: String!) {
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
        credential_type
        uses
      }
    }
  }
`;

/**
 * __useActionsQuery__
 *
 * To run a query within a React component, call `useActionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useActionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useActionsQuery({
 *   variables: {
 *      app_id: // value for 'app_id'
 *   },
 * });
 */
export function useActionsQuery(
  baseOptions: Apollo.QueryHookOptions<ActionsQuery, ActionsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ActionsQuery, ActionsQueryVariables>(
    ActionsDocument,
    options
  );
}
export function useActionsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<ActionsQuery, ActionsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<ActionsQuery, ActionsQueryVariables>(
    ActionsDocument,
    options
  );
}
export type ActionsQueryHookResult = ReturnType<typeof useActionsQuery>;
export type ActionsLazyQueryHookResult = ReturnType<typeof useActionsLazyQuery>;
export type ActionsQueryResult = Apollo.QueryResult<
  ActionsQuery,
  ActionsQueryVariables
>;
