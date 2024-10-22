/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpdateAppInfoMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  input?: Types.InputMaybe<Types.App_Metadata_Set_Input>;
}>;

export type UpdateAppInfoMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
};

export const UpdateAppInfoDocument = gql`
  mutation UpdateAppInfo(
    $app_metadata_id: String!
    $input: app_metadata_set_input
  ) {
    update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: $input
    ) {
      id
    }
  }
`;
export type UpdateAppInfoMutationFn = Apollo.MutationFunction<
  UpdateAppInfoMutation,
  UpdateAppInfoMutationVariables
>;

/**
 * __useUpdateAppInfoMutation__
 *
 * To run a mutation, you first call `useUpdateAppInfoMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateAppInfoMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateAppInfoMutation, { data, loading, error }] = useUpdateAppInfoMutation({
 *   variables: {
 *      app_metadata_id: // value for 'app_metadata_id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateAppInfoMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateAppInfoMutation,
    UpdateAppInfoMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateAppInfoMutation,
    UpdateAppInfoMutationVariables
  >(UpdateAppInfoDocument, options);
}
export type UpdateAppInfoMutationHookResult = ReturnType<
  typeof useUpdateAppInfoMutation
>;
export type UpdateAppInfoMutationResult =
  Apollo.MutationResult<UpdateAppInfoMutation>;
export type UpdateAppInfoMutationOptions = Apollo.BaseMutationOptions<
  UpdateAppInfoMutation,
  UpdateAppInfoMutationVariables
>;
