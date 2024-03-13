/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type AddEmailToUserMutationVariables = Types.Exact<{
  id: Types.Scalars["String"];
  email: Types.Scalars["String"];
}>;

export type AddEmailToUserMutation = {
  __typename?: "mutation_root";
  update_user_by_pk?: {
    __typename?: "user";
    id: string;
    email?: string | null;
  } | null;
};

export const AddEmailToUserDocument = gql`
  mutation AddEmailToUser($id: String!, $email: String!) {
    update_user_by_pk(pk_columns: { id: $id }, _set: { email: $email }) {
      id
      email
    }
  }
`;
export type AddEmailToUserMutationFn = Apollo.MutationFunction<
  AddEmailToUserMutation,
  AddEmailToUserMutationVariables
>;

/**
 * __useAddEmailToUserMutation__
 *
 * To run a mutation, you first call `useAddEmailToUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddEmailToUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addEmailToUserMutation, { data, loading, error }] = useAddEmailToUserMutation({
 *   variables: {
 *      id: // value for 'id'
 *      email: // value for 'email'
 *   },
 * });
 */
export function useAddEmailToUserMutation(
  baseOptions?: Apollo.MutationHookOptions<
    AddEmailToUserMutation,
    AddEmailToUserMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    AddEmailToUserMutation,
    AddEmailToUserMutationVariables
  >(AddEmailToUserDocument, options);
}
export type AddEmailToUserMutationHookResult = ReturnType<
  typeof useAddEmailToUserMutation
>;
export type AddEmailToUserMutationResult =
  Apollo.MutationResult<AddEmailToUserMutation>;
export type AddEmailToUserMutationOptions = Apollo.BaseMutationOptions<
  AddEmailToUserMutation,
  AddEmailToUserMutationVariables
>;
