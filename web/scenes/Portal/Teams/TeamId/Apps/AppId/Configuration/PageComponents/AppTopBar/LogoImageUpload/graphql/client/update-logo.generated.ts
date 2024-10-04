/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpdateLogoMutationVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
  fileName: Types.Scalars["String"]["input"];
}>;

export type UpdateLogoMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
};

export const UpdateLogoDocument = gql`
  mutation UpdateLogo($id: String!, $fileName: String!) {
    update_app_metadata_by_pk(
      pk_columns: { id: $id }
      _set: { logo_img_url: $fileName }
    ) {
      id
    }
  }
`;
export type UpdateLogoMutationFn = Apollo.MutationFunction<
  UpdateLogoMutation,
  UpdateLogoMutationVariables
>;

/**
 * __useUpdateLogoMutation__
 *
 * To run a mutation, you first call `useUpdateLogoMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateLogoMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateLogoMutation, { data, loading, error }] = useUpdateLogoMutation({
 *   variables: {
 *      id: // value for 'id'
 *      fileName: // value for 'fileName'
 *   },
 * });
 */
export function useUpdateLogoMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateLogoMutation,
    UpdateLogoMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<UpdateLogoMutation, UpdateLogoMutationVariables>(
    UpdateLogoDocument,
    options,
  );
}
export type UpdateLogoMutationHookResult = ReturnType<
  typeof useUpdateLogoMutation
>;
export type UpdateLogoMutationResult =
  Apollo.MutationResult<UpdateLogoMutation>;
export type UpdateLogoMutationOptions = Apollo.BaseMutationOptions<
  UpdateLogoMutation,
  UpdateLogoMutationVariables
>;
