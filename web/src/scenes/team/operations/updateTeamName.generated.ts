/* eslint-disable */
import * as Types from "../../graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpdateTeamNameMutationVariables = Types.Exact<{
  id: Types.Scalars["String"];
  name: Types.Scalars["String"];
}>;

export type UpdateTeamNameMutation = {
  __typename?: "mutation_root";
  team?: { __typename?: "team"; id: string } | null;
};

export const UpdateTeamNameDocument = gql`
  mutation UpdateTeamName($id: String!, $name: String!) {
    team: update_team_by_pk(pk_columns: { id: $id }, _set: { name: $name }) {
      id
    }
  }
`;
export type UpdateTeamNameMutationFn = Apollo.MutationFunction<
  UpdateTeamNameMutation,
  UpdateTeamNameMutationVariables
>;

/**
 * __useUpdateTeamNameMutation__
 *
 * To run a mutation, you first call `useUpdateTeamNameMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateTeamNameMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateTeamNameMutation, { data, loading, error }] = useUpdateTeamNameMutation({
 *   variables: {
 *      id: // value for 'id'
 *      name: // value for 'name'
 *   },
 * });
 */
export function useUpdateTeamNameMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateTeamNameMutation,
    UpdateTeamNameMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateTeamNameMutation,
    UpdateTeamNameMutationVariables
  >(UpdateTeamNameDocument, options);
}
export type UpdateTeamNameMutationHookResult = ReturnType<
  typeof useUpdateTeamNameMutation
>;
export type UpdateTeamNameMutationResult =
  Apollo.MutationResult<UpdateTeamNameMutation>;
export type UpdateTeamNameMutationOptions = Apollo.BaseMutationOptions<
  UpdateTeamNameMutation,
  UpdateTeamNameMutationVariables
>;
