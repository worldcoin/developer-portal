/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type ActionQueryVariables = Types.Exact<{
  action_id: Types.Scalars["String"];
}>;

export type ActionQuery = {
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
      updated_at: any;
      nullifier_hash: string;
      uses?: number | null;
    }>;
  }>;
};

export const ActionDocument = gql`
  query Action($action_id: String!) {
    action(order_by: { created_at: asc }, where: { id: { _eq: $action_id } }) {
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
        updated_at
        nullifier_hash
        uses
      }
    }
  }
`;

/**
 * __useActionQuery__
 *
 * To run a query within a React component, call `useActionQuery` and pass it any options that fit your needs.
 * When your component renders, `useActionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useActionQuery({
 *   variables: {
 *      action_id: // value for 'action_id'
 *   },
 * });
 */
export function useActionQuery(
  baseOptions: Apollo.QueryHookOptions<ActionQuery, ActionQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ActionQuery, ActionQueryVariables>(
    ActionDocument,
    options,
  );
}
export function useActionLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<ActionQuery, ActionQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<ActionQuery, ActionQueryVariables>(
    ActionDocument,
    options,
  );
}
export type ActionQueryHookResult = ReturnType<typeof useActionQuery>;
export type ActionLazyQueryHookResult = ReturnType<typeof useActionLazyQuery>;
export type ActionQueryResult = Apollo.QueryResult<
  ActionQuery,
  ActionQueryVariables
>;
