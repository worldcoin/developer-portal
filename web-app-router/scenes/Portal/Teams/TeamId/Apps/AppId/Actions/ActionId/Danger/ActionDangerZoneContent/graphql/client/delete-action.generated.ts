/* eslint-disable */
import * as Types from '@/graphql/graphql';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type DeleteActionMutationVariables = Types.Exact<{
  id: Types.Scalars['String'];
}>;


export type DeleteActionMutation = { __typename?: 'mutation_root', delete_action_by_pk?: { __typename?: 'action', id: string } | null };


export const DeleteActionDocument = gql`
    mutation DeleteAction($id: String!) {
  delete_action_by_pk(id: $id) {
    id
  }
}
    `;
export type DeleteActionMutationFn = Apollo.MutationFunction<DeleteActionMutation, DeleteActionMutationVariables>;

/**
 * __useDeleteActionMutation__
 *
 * To run a mutation, you first call `useDeleteActionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteActionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteActionMutation, { data, loading, error }] = useDeleteActionMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteActionMutation(baseOptions?: Apollo.MutationHookOptions<DeleteActionMutation, DeleteActionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteActionMutation, DeleteActionMutationVariables>(DeleteActionDocument, options);
      }
export type DeleteActionMutationHookResult = ReturnType<typeof useDeleteActionMutation>;
export type DeleteActionMutationResult = Apollo.MutationResult<DeleteActionMutation>;
export type DeleteActionMutationOptions = Apollo.BaseMutationOptions<DeleteActionMutation, DeleteActionMutationVariables>;