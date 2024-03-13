/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type AddNullifierToUserMutationVariables = Types.Exact<{
  id: Types.Scalars["String"];
  nullifier_hash: Types.Scalars["String"];
}>;

export type AddNullifierToUserMutation = {
  __typename?: "mutation_root";
  update_user_by_pk?: {
    __typename?: "user";
    id: string;
    world_id_nullifier?: string | null;
  } | null;
};

export const AddNullifierToUserDocument = gql`
  mutation AddNullifierToUser($id: String!, $nullifier_hash: String!) {
    update_user_by_pk(
      pk_columns: { id: $id }
      _set: { world_id_nullifier: $nullifier_hash }
    ) {
      id
      world_id_nullifier
    }
  }
`;
export type AddNullifierToUserMutationFn = Apollo.MutationFunction<
  AddNullifierToUserMutation,
  AddNullifierToUserMutationVariables
>;

/**
 * __useAddNullifierToUserMutation__
 *
 * To run a mutation, you first call `useAddNullifierToUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddNullifierToUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addNullifierToUserMutation, { data, loading, error }] = useAddNullifierToUserMutation({
 *   variables: {
 *      id: // value for 'id'
 *      nullifier_hash: // value for 'nullifier_hash'
 *   },
 * });
 */
export function useAddNullifierToUserMutation(
  baseOptions?: Apollo.MutationHookOptions<
    AddNullifierToUserMutation,
    AddNullifierToUserMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    AddNullifierToUserMutation,
    AddNullifierToUserMutationVariables
  >(AddNullifierToUserDocument, options);
}
export type AddNullifierToUserMutationHookResult = ReturnType<
  typeof useAddNullifierToUserMutation
>;
export type AddNullifierToUserMutationResult =
  Apollo.MutationResult<AddNullifierToUserMutation>;
export type AddNullifierToUserMutationOptions = Apollo.BaseMutationOptions<
  AddNullifierToUserMutation,
  AddNullifierToUserMutationVariables
>;
