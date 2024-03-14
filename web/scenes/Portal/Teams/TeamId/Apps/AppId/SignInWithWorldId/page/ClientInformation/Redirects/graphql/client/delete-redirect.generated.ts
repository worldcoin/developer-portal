/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type DeleteRedirectMutationVariables = Types.Exact<{
  id: Types.Scalars["String"];
}>;

export type DeleteRedirectMutation = {
  __typename?: "mutation_root";
  delete_redirect_by_pk?: { __typename?: "redirect"; id: string } | null;
};

export const DeleteRedirectDocument = gql`
  mutation DeleteRedirect($id: String!) {
    delete_redirect_by_pk(id: $id) {
      id
    }
  }
`;
export type DeleteRedirectMutationFn = Apollo.MutationFunction<
  DeleteRedirectMutation,
  DeleteRedirectMutationVariables
>;

/**
 * __useDeleteRedirectMutation__
 *
 * To run a mutation, you first call `useDeleteRedirectMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteRedirectMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteRedirectMutation, { data, loading, error }] = useDeleteRedirectMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteRedirectMutation(
  baseOptions?: Apollo.MutationHookOptions<
    DeleteRedirectMutation,
    DeleteRedirectMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    DeleteRedirectMutation,
    DeleteRedirectMutationVariables
  >(DeleteRedirectDocument, options);
}
export type DeleteRedirectMutationHookResult = ReturnType<
  typeof useDeleteRedirectMutation
>;
export type DeleteRedirectMutationResult =
  Apollo.MutationResult<DeleteRedirectMutation>;
export type DeleteRedirectMutationOptions = Apollo.BaseMutationOptions<
  DeleteRedirectMutation,
  DeleteRedirectMutationVariables
>;

