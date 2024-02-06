/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpdateAppLinksInfoMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"];
  input?: Types.InputMaybe<Types.App_Metadata_Set_Input>;
}>;

export type UpdateAppLinksInfoMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
};

export const UpdateAppLinksInfoDocument = gql`
  mutation UpdateAppLinksInfo(
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
export type UpdateAppLinksInfoMutationFn = Apollo.MutationFunction<
  UpdateAppLinksInfoMutation,
  UpdateAppLinksInfoMutationVariables
>;

/**
 * __useUpdateAppLinksInfoMutation__
 *
 * To run a mutation, you first call `useUpdateAppLinksInfoMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateAppLinksInfoMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateAppLinksInfoMutation, { data, loading, error }] = useUpdateAppLinksInfoMutation({
 *   variables: {
 *      app_metadata_id: // value for 'app_metadata_id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateAppLinksInfoMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateAppLinksInfoMutation,
    UpdateAppLinksInfoMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateAppLinksInfoMutation,
    UpdateAppLinksInfoMutationVariables
  >(UpdateAppLinksInfoDocument, options);
}
export type UpdateAppLinksInfoMutationHookResult = ReturnType<
  typeof useUpdateAppLinksInfoMutation
>;
export type UpdateAppLinksInfoMutationResult =
  Apollo.MutationResult<UpdateAppLinksInfoMutation>;
export type UpdateAppLinksInfoMutationOptions = Apollo.BaseMutationOptions<
  UpdateAppLinksInfoMutation,
  UpdateAppLinksInfoMutationVariables
>;
