/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type FetchMembershipsQueryVariables = Types.Exact<{
  teamId: Types.Scalars["String"];
}>;

export type FetchMembershipsQuery = {
  __typename?: "query_root";
  membership: Array<{
    __typename?: "membership";
    id: string;
    role: Types.Role_Enum;
    user: {
      __typename?: "user";
      name: string;
      email?: string | null;
      id: string;
    };
  }>;
};

export const FetchMembershipsDocument = gql`
  query FetchMemberships($teamId: String!) {
    membership(where: { team_id: { _eq: $teamId } }) {
      id
      role
      user {
        name
        email
        id
      }
    }
  }
`;

/**
 * __useFetchMembershipsQuery__
 *
 * To run a query within a React component, call `useFetchMembershipsQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchMembershipsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchMembershipsQuery({
 *   variables: {
 *      teamId: // value for 'teamId'
 *   },
 * });
 */
export function useFetchMembershipsQuery(
  baseOptions: Apollo.QueryHookOptions<
    FetchMembershipsQuery,
    FetchMembershipsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<FetchMembershipsQuery, FetchMembershipsQueryVariables>(
    FetchMembershipsDocument,
    options,
  );
}
export function useFetchMembershipsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    FetchMembershipsQuery,
    FetchMembershipsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    FetchMembershipsQuery,
    FetchMembershipsQueryVariables
  >(FetchMembershipsDocument, options);
}
export type FetchMembershipsQueryHookResult = ReturnType<
  typeof useFetchMembershipsQuery
>;
export type FetchMembershipsLazyQueryHookResult = ReturnType<
  typeof useFetchMembershipsLazyQuery
>;
export type FetchMembershipsQueryResult = Apollo.QueryResult<
  FetchMembershipsQuery,
  FetchMembershipsQueryVariables
>;
