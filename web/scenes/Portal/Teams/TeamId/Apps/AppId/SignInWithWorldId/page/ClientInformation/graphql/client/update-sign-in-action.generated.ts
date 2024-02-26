/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpdateSignInActionMutationVariables = Types.Exact<{
  id: Types.Scalars["String"];
  input?: Types.InputMaybe<Types.Action_Set_Input>;
}>;

export type UpdateSignInActionMutation = {
  __typename?: "mutation_root";
  update_action_by_pk?: { __typename?: "action"; id: string } | null;
};

export const UpdateSignInActionDocument = gql`
  mutation UpdateSignInAction($id: String!, $input: action_set_input) {
    update_action_by_pk(pk_columns: { id: $id }, _set: $input) {
      id
    }
  }
`;
export type UpdateSignInActionMutationFn = Apollo.MutationFunction<
  UpdateSignInActionMutation,
  UpdateSignInActionMutationVariables
>;

/**
 * __useUpdateSignInActionMutation__
 *
 * To run a mutation, you first call `useUpdateSignInActionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateSignInActionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateSignInActionMutation, { data, loading, error }] = useUpdateSignInActionMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateSignInActionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateSignInActionMutation,
    UpdateSignInActionMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateSignInActionMutation,
    UpdateSignInActionMutationVariables
  >(UpdateSignInActionDocument, options);
}
export type UpdateSignInActionMutationHookResult = ReturnType<
  typeof useUpdateSignInActionMutation
>;
export type UpdateSignInActionMutationResult =
  Apollo.MutationResult<UpdateSignInActionMutation>;
export type UpdateSignInActionMutationOptions = Apollo.BaseMutationOptions<
  UpdateSignInActionMutation,
  UpdateSignInActionMutationVariables
>;
