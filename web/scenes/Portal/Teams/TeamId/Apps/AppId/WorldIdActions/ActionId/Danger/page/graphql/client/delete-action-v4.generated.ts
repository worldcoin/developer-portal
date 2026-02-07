/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type DeleteActionV4MutationVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type DeleteActionV4Mutation = {
  __typename?: "mutation_root";
  delete_action_v4_by_pk?: { __typename?: "action_v4"; id: string } | null;
};

export const DeleteActionV4Document = gql`
  mutation DeleteActionV4($id: String!) {
    delete_action_v4_by_pk(id: $id) {
      id
    }
  }
`;
export type DeleteActionV4MutationFn = Apollo.MutationFunction<
  DeleteActionV4Mutation,
  DeleteActionV4MutationVariables
>;

/**
 * __useDeleteActionV4Mutation__
 *
 * To run a mutation, you first call `useDeleteActionV4Mutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteActionV4Mutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteActionV4Mutation, { data, loading, error }] = useDeleteActionV4Mutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteActionV4Mutation(
  baseOptions?: Apollo.MutationHookOptions<
    DeleteActionV4Mutation,
    DeleteActionV4MutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    DeleteActionV4Mutation,
    DeleteActionV4MutationVariables
  >(DeleteActionV4Document, options);
}
export type DeleteActionV4MutationHookResult = ReturnType<
  typeof useDeleteActionV4Mutation
>;
export type DeleteActionV4MutationResult =
  Apollo.MutationResult<DeleteActionV4Mutation>;
export type DeleteActionV4MutationOptions = Apollo.BaseMutationOptions<
  DeleteActionV4Mutation,
  DeleteActionV4MutationVariables
>;
