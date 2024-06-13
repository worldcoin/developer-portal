/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpdateKeyMutationVariables = Types.Exact<{
  id: Types.Scalars["String"];
  name: Types.Scalars["String"];
  is_active: Types.Scalars["Boolean"];
}>;

export type UpdateKeyMutation = {
  __typename?: "mutation_root";
  update_api_key_by_pk?: {
    __typename?: "api_key";
    id: string;
    team_id: string;
    created_at: string;
    updated_at: string;
    is_active: boolean;
    name: string;
  } | null;
};

export const UpdateKeyDocument = gql`
  mutation UpdateKey($id: String!, $name: String!, $is_active: Boolean!) {
    update_api_key_by_pk(
      pk_columns: { id: $id }
      _set: { name: $name, is_active: $is_active }
    ) {
      id
      team_id
      created_at
      updated_at
      is_active
      name
    }
  }
`;
export type UpdateKeyMutationFn = Apollo.MutationFunction<
  UpdateKeyMutation,
  UpdateKeyMutationVariables
>;

/**
 * __useUpdateKeyMutation__
 *
 * To run a mutation, you first call `useUpdateKeyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateKeyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateKeyMutation, { data, loading, error }] = useUpdateKeyMutation({
 *   variables: {
 *      id: // value for 'id'
 *      name: // value for 'name'
 *      is_active: // value for 'is_active'
 *   },
 * });
 */
export function useUpdateKeyMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateKeyMutation,
    UpdateKeyMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<UpdateKeyMutation, UpdateKeyMutationVariables>(
    UpdateKeyDocument,
    options,
  );
}
export type UpdateKeyMutationHookResult = ReturnType<
  typeof useUpdateKeyMutation
>;
export type UpdateKeyMutationResult = Apollo.MutationResult<UpdateKeyMutation>;
export type UpdateKeyMutationOptions = Apollo.BaseMutationOptions<
  UpdateKeyMutation,
  UpdateKeyMutationVariables
>;
