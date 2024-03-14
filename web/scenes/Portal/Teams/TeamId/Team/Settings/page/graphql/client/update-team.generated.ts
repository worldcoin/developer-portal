/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpdateTeamMutationVariables = Types.Exact<{
  id: Types.Scalars["String"];
  input?: Types.InputMaybe<Types.Team_Set_Input>;
}>;

export type UpdateTeamMutation = {
  __typename?: "mutation_root";
  update_team_by_pk?: { __typename?: "team"; id: string } | null;
};

export const UpdateTeamDocument = gql`
  mutation UpdateTeam($id: String!, $input: team_set_input = {}) {
    update_team_by_pk(pk_columns: { id: $id }, _set: $input) {
      id
    }
  }
`;
export type UpdateTeamMutationFn = Apollo.MutationFunction<
  UpdateTeamMutation,
  UpdateTeamMutationVariables
>;

/**
 * __useUpdateTeamMutation__
 *
 * To run a mutation, you first call `useUpdateTeamMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateTeamMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateTeamMutation, { data, loading, error }] = useUpdateTeamMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateTeamMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateTeamMutation,
    UpdateTeamMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<UpdateTeamMutation, UpdateTeamMutationVariables>(
    UpdateTeamDocument,
    options,
  );
}
export type UpdateTeamMutationHookResult = ReturnType<
  typeof useUpdateTeamMutation
>;
export type UpdateTeamMutationResult =
  Apollo.MutationResult<UpdateTeamMutation>;
export type UpdateTeamMutationOptions = Apollo.BaseMutationOptions<
  UpdateTeamMutation,
  UpdateTeamMutationVariables
>;

