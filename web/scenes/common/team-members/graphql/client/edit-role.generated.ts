/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type EditRoleMutationVariables = Types.Exact<{
  membershipId: Types.Scalars["String"]["input"];
  role?: Types.InputMaybe<Types.Role_Enum>;
}>;

export type EditRoleMutation = {
  __typename?: "mutation_root";
  update_membership_by_pk?: {
    __typename?: "membership";
    role: Types.Role_Enum;
  } | null;
};

export const EditRoleDocument = gql`
  mutation EditRole($membershipId: String!, $role: role_enum) {
    update_membership_by_pk(
      pk_columns: { id: $membershipId }
      _set: { role: $role }
    ) {
      role
    }
  }
`;
export type EditRoleMutationFn = Apollo.MutationFunction<
  EditRoleMutation,
  EditRoleMutationVariables
>;

/**
 * __useEditRoleMutation__
 *
 * To run a mutation, you first call `useEditRoleMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useEditRoleMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [editRoleMutation, { data, loading, error }] = useEditRoleMutation({
 *   variables: {
 *      membershipId: // value for 'membershipId'
 *      role: // value for 'role'
 *   },
 * });
 */
export function useEditRoleMutation(
  baseOptions?: Apollo.MutationHookOptions<
    EditRoleMutation,
    EditRoleMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<EditRoleMutation, EditRoleMutationVariables>(
    EditRoleDocument,
    options,
  );
}
export type EditRoleMutationHookResult = ReturnType<typeof useEditRoleMutation>;
export type EditRoleMutationResult = Apollo.MutationResult<EditRoleMutation>;
export type EditRoleMutationOptions = Apollo.BaseMutationOptions<
  EditRoleMutation,
  EditRoleMutationVariables
>;
