/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type DeleteTeamMemberMutationVariables = Types.Exact<{
  id: Types.Scalars["String"];
}>;

export type DeleteTeamMemberMutation = {
  __typename?: "mutation_root";
  member?: { __typename?: "membership"; user_id: string } | null;
};

export const DeleteTeamMemberDocument = gql`
  mutation DeleteTeamMember($id: String!) {
    member: delete_membership_by_pk(id: $id) {
      user_id
    }
  }
`;
export type DeleteTeamMemberMutationFn = Apollo.MutationFunction<
  DeleteTeamMemberMutation,
  DeleteTeamMemberMutationVariables
>;

/**
 * __useDeleteTeamMemberMutation__
 *
 * To run a mutation, you first call `useDeleteTeamMemberMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteTeamMemberMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteTeamMemberMutation, { data, loading, error }] = useDeleteTeamMemberMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteTeamMemberMutation(
  baseOptions?: Apollo.MutationHookOptions<
    DeleteTeamMemberMutation,
    DeleteTeamMemberMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    DeleteTeamMemberMutation,
    DeleteTeamMemberMutationVariables
  >(DeleteTeamMemberDocument, options);
}
export type DeleteTeamMemberMutationHookResult = ReturnType<
  typeof useDeleteTeamMemberMutation
>;
export type DeleteTeamMemberMutationResult =
  Apollo.MutationResult<DeleteTeamMemberMutation>;
export type DeleteTeamMemberMutationOptions = Apollo.BaseMutationOptions<
  DeleteTeamMemberMutation,
  DeleteTeamMemberMutationVariables
>;
