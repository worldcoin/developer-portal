/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type DeleteKeyMutationVariables = Types.Exact<{
  id: Types.Scalars["String"];
}>;

export type DeleteKeyMutation = {
  __typename?: "mutation_root";
  delete_api_key_by_pk?: { __typename?: "api_key"; id: string } | null;
};

export const DeleteKeyDocument = gql`
  mutation DeleteKey($id: String!) {
    delete_api_key_by_pk(id: $id) {
      id
    }
  }
`;
export type DeleteKeyMutationFn = Apollo.MutationFunction<
  DeleteKeyMutation,
  DeleteKeyMutationVariables
>;

/**
 * __useDeleteKeyMutation__
 *
 * To run a mutation, you first call `useDeleteKeyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteKeyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteKeyMutation, { data, loading, error }] = useDeleteKeyMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteKeyMutation(
  baseOptions?: Apollo.MutationHookOptions<
    DeleteKeyMutation,
    DeleteKeyMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<DeleteKeyMutation, DeleteKeyMutationVariables>(
    DeleteKeyDocument,
    options,
  );
}
export type DeleteKeyMutationHookResult = ReturnType<
  typeof useDeleteKeyMutation
>;
export type DeleteKeyMutationResult = Apollo.MutationResult<DeleteKeyMutation>;
export type DeleteKeyMutationOptions = Apollo.BaseMutationOptions<
  DeleteKeyMutation,
  DeleteKeyMutationVariables
>;
