/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type TransferOwnershipMutationVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
  role?: Types.InputMaybe<Types.Role_Enum>;
  user_member_id: Types.Scalars["String"]["input"];
  user_role?: Types.InputMaybe<Types.Role_Enum>;
}>;

export type TransferOwnershipMutation = {
  __typename?: "mutation_root";
  transferOwner?: { __typename?: "membership"; id: string } | null;
  updateUser?: { __typename?: "membership"; id: string } | null;
};

export const TransferOwnershipDocument = gql`
  mutation TransferOwnership(
    $id: String!
    $role: role_enum = OWNER
    $user_member_id: String!
    $user_role: role_enum = ADMIN
  ) {
    transferOwner: update_membership_by_pk(
      pk_columns: { id: $id }
      _set: { role: $role }
    ) {
      id
    }
    updateUser: update_membership_by_pk(
      pk_columns: { id: $user_member_id }
      _set: { role: $user_role }
    ) {
      id
    }
  }
`;
export type TransferOwnershipMutationFn = Apollo.MutationFunction<
  TransferOwnershipMutation,
  TransferOwnershipMutationVariables
>;

/**
 * __useTransferOwnershipMutation__
 *
 * To run a mutation, you first call `useTransferOwnershipMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useTransferOwnershipMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [transferOwnershipMutation, { data, loading, error }] = useTransferOwnershipMutation({
 *   variables: {
 *      id: // value for 'id'
 *      role: // value for 'role'
 *      user_member_id: // value for 'user_member_id'
 *      user_role: // value for 'user_role'
 *   },
 * });
 */
export function useTransferOwnershipMutation(
  baseOptions?: Apollo.MutationHookOptions<
    TransferOwnershipMutation,
    TransferOwnershipMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    TransferOwnershipMutation,
    TransferOwnershipMutationVariables
  >(TransferOwnershipDocument, options);
}
export type TransferOwnershipMutationHookResult = ReturnType<
  typeof useTransferOwnershipMutation
>;
export type TransferOwnershipMutationResult =
  Apollo.MutationResult<TransferOwnershipMutation>;
export type TransferOwnershipMutationOptions = Apollo.BaseMutationOptions<
  TransferOwnershipMutation,
  TransferOwnershipMutationVariables
>;
