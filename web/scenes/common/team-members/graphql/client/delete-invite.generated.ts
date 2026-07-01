/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type DeleteInviteMutationVariables = Types.Exact<{
  inviteId: Types.Scalars["String"]["input"];
}>;

export type DeleteInviteMutation = {
  __typename?: "mutation_root";
  delete_invite_by_pk?: { __typename?: "invite"; id: string } | null;
};

export const DeleteInviteDocument = gql`
  mutation DeleteInvite($inviteId: String!) {
    delete_invite_by_pk(id: $inviteId) {
      id
    }
  }
`;
export type DeleteInviteMutationFn = Apollo.MutationFunction<
  DeleteInviteMutation,
  DeleteInviteMutationVariables
>;

/**
 * __useDeleteInviteMutation__
 *
 * To run a mutation, you first call `useDeleteInviteMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteInviteMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteInviteMutation, { data, loading, error }] = useDeleteInviteMutation({
 *   variables: {
 *      inviteId: // value for 'inviteId'
 *   },
 * });
 */
export function useDeleteInviteMutation(
  baseOptions?: Apollo.MutationHookOptions<
    DeleteInviteMutation,
    DeleteInviteMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    DeleteInviteMutation,
    DeleteInviteMutationVariables
  >(DeleteInviteDocument, options);
}
export type DeleteInviteMutationHookResult = ReturnType<
  typeof useDeleteInviteMutation
>;
export type DeleteInviteMutationResult =
  Apollo.MutationResult<DeleteInviteMutation>;
export type DeleteInviteMutationOptions = Apollo.BaseMutationOptions<
  DeleteInviteMutation,
  DeleteInviteMutationVariables
>;
