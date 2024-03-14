/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpdateAppVerificationStatusMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"];
  verification_status: Types.Scalars["String"];
}>;

export type UpdateAppVerificationStatusMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
};

export const UpdateAppVerificationStatusDocument = gql`
  mutation UpdateAppVerificationStatus(
    $app_metadata_id: String!
    $verification_status: String!
  ) {
    update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: { verification_status: $verification_status }
    ) {
      id
    }
  }
`;
export type UpdateAppVerificationStatusMutationFn = Apollo.MutationFunction<
  UpdateAppVerificationStatusMutation,
  UpdateAppVerificationStatusMutationVariables
>;

/**
 * __useUpdateAppVerificationStatusMutation__
 *
 * To run a mutation, you first call `useUpdateAppVerificationStatusMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateAppVerificationStatusMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateAppVerificationStatusMutation, { data, loading, error }] = useUpdateAppVerificationStatusMutation({
 *   variables: {
 *      app_metadata_id: // value for 'app_metadata_id'
 *      verification_status: // value for 'verification_status'
 *   },
 * });
 */
export function useUpdateAppVerificationStatusMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateAppVerificationStatusMutation,
    UpdateAppVerificationStatusMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateAppVerificationStatusMutation,
    UpdateAppVerificationStatusMutationVariables
  >(UpdateAppVerificationStatusDocument, options);
}
export type UpdateAppVerificationStatusMutationHookResult = ReturnType<
  typeof useUpdateAppVerificationStatusMutation
>;
export type UpdateAppVerificationStatusMutationResult =
  Apollo.MutationResult<UpdateAppVerificationStatusMutation>;
export type UpdateAppVerificationStatusMutationOptions =
  Apollo.BaseMutationOptions<
    UpdateAppVerificationStatusMutation,
    UpdateAppVerificationStatusMutationVariables
  >;

