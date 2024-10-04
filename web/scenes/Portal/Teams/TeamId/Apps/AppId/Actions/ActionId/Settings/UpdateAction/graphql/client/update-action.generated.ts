/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpdateActionMutationVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
  input?: Types.InputMaybe<Types.Action_Set_Input>;
}>;

export type UpdateActionMutation = {
  __typename?: "mutation_root";
  update_action_by_pk?: {
    __typename?: "action";
    id: string;
    name: string;
    description: string;
    max_verifications: number;
    status: string;
  } | null;
};

export const UpdateActionDocument = gql`
  mutation UpdateAction($id: String!, $input: action_set_input) {
    update_action_by_pk(pk_columns: { id: $id }, _set: $input) {
      id
      name
      description
      max_verifications
      status
    }
  }
`;
export type UpdateActionMutationFn = Apollo.MutationFunction<
  UpdateActionMutation,
  UpdateActionMutationVariables
>;

/**
 * __useUpdateActionMutation__
 *
 * To run a mutation, you first call `useUpdateActionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateActionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateActionMutation, { data, loading, error }] = useUpdateActionMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateActionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateActionMutation,
    UpdateActionMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateActionMutation,
    UpdateActionMutationVariables
  >(UpdateActionDocument, options);
}
export type UpdateActionMutationHookResult = ReturnType<
  typeof useUpdateActionMutation
>;
export type UpdateActionMutationResult =
  Apollo.MutationResult<UpdateActionMutation>;
export type UpdateActionMutationOptions = Apollo.BaseMutationOptions<
  UpdateActionMutation,
  UpdateActionMutationVariables
>;
