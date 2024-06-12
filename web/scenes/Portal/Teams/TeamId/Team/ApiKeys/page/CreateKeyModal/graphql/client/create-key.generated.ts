/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type InsertKeyMutationVariables = Types.Exact<{
  name: Types.Scalars["String"];
  teamId: Types.Scalars["String"];
}>;

export type InsertKeyMutation = {
  __typename?: "mutation_root";
  insert_api_key_one?: {
    __typename?: "api_key";
    id: string;
    team_id: string;
    created_at: string;
    updated_at: string;
    is_active: boolean;
    name: string;
  } | null;
};

export const InsertKeyDocument = gql`
  mutation InsertKey($name: String!, $teamId: String!) {
    insert_api_key_one(object: { name: $name, team_id: $teamId }) {
      id
      team_id
      created_at
      updated_at
      is_active
      name
    }
  }
`;
export type InsertKeyMutationFn = Apollo.MutationFunction<
  InsertKeyMutation,
  InsertKeyMutationVariables
>;

/**
 * __useInsertKeyMutation__
 *
 * To run a mutation, you first call `useInsertKeyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useInsertKeyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [insertKeyMutation, { data, loading, error }] = useInsertKeyMutation({
 *   variables: {
 *      name: // value for 'name'
 *      teamId: // value for 'teamId'
 *   },
 * });
 */
export function useInsertKeyMutation(
  baseOptions?: Apollo.MutationHookOptions<
    InsertKeyMutation,
    InsertKeyMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<InsertKeyMutation, InsertKeyMutationVariables>(
    InsertKeyDocument,
    options,
  );
}
export type InsertKeyMutationHookResult = ReturnType<
  typeof useInsertKeyMutation
>;
export type InsertKeyMutationResult = Apollo.MutationResult<InsertKeyMutation>;
export type InsertKeyMutationOptions = Apollo.BaseMutationOptions<
  InsertKeyMutation,
  InsertKeyMutationVariables
>;
