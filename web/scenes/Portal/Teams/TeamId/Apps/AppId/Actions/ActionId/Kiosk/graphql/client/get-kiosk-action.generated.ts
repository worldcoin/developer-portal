/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetKioskActionQueryVariables = Types.Exact<{
  action_id: Types.Scalars["String"]["input"];
  app_id: Types.Scalars["String"]["input"];
}>;

export type GetKioskActionQuery = {
  __typename?: "query_root";
  action: Array<{
    __typename?: "action";
    id: string;
    app_id: string;
    action: string;
    description: string;
    name: string;
    max_verifications: number;
    kiosk_enabled: boolean;
    app_flow_on_complete?: unknown | null;
    webhook_uri?: string | null;
    webhook_pem?: string | null;
  }>;
  app: Array<{ __typename?: "app"; engine: string }>;
  app_metadata: Array<{ __typename?: "app_metadata"; logo_img_url: string }>;
};

export const GetKioskActionDocument = gql`
  query GetKioskAction($action_id: String!, $app_id: String!) {
    action(order_by: { created_at: asc }, where: { id: { _eq: $action_id } }) {
      id
      app_id
      action
      description
      name
      max_verifications
      kiosk_enabled
      app_flow_on_complete
      webhook_uri
      webhook_pem
    }
    app {
      engine
    }
    app_metadata(
      where: {
        app_id: { _eq: $app_id }
        verification_status: { _eq: "verified" }
      }
    ) {
      logo_img_url
    }
  }
`;

/**
 * __useGetKioskActionQuery__
 *
 * To run a query within a React component, call `useGetKioskActionQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetKioskActionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetKioskActionQuery({
 *   variables: {
 *      action_id: // value for 'action_id'
 *      app_id: // value for 'app_id'
 *   },
 * });
 */
export function useGetKioskActionQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetKioskActionQuery,
    GetKioskActionQueryVariables
  > &
    (
      | { variables: GetKioskActionQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetKioskActionQuery, GetKioskActionQueryVariables>(
    GetKioskActionDocument,
    options,
  );
}
export function useGetKioskActionLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetKioskActionQuery,
    GetKioskActionQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetKioskActionQuery, GetKioskActionQueryVariables>(
    GetKioskActionDocument,
    options,
  );
}
export function useGetKioskActionSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetKioskActionQuery,
        GetKioskActionQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetKioskActionQuery,
    GetKioskActionQueryVariables
  >(GetKioskActionDocument, options);
}
export type GetKioskActionQueryHookResult = ReturnType<
  typeof useGetKioskActionQuery
>;
export type GetKioskActionLazyQueryHookResult = ReturnType<
  typeof useGetKioskActionLazyQuery
>;
export type GetKioskActionSuspenseQueryHookResult = ReturnType<
  typeof useGetKioskActionSuspenseQuery
>;
export type GetKioskActionQueryResult = Apollo.QueryResult<
  GetKioskActionQuery,
  GetKioskActionQueryVariables
>;
