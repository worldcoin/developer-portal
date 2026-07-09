/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpdateContentCardImageMutationVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
  fileName: Types.Scalars["String"]["input"];
}>;

export type UpdateContentCardImageMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
};

export const UpdateContentCardImageDocument = gql`
  mutation UpdateContentCardImage($id: String!, $fileName: String!) {
    update_app_metadata_by_pk(
      pk_columns: { id: $id }
      _set: { content_card_image_url: $fileName }
    ) {
      id
    }
  }
`;
export type UpdateContentCardImageMutationFn = Apollo.MutationFunction<
  UpdateContentCardImageMutation,
  UpdateContentCardImageMutationVariables
>;

/**
 * __useUpdateContentCardImageMutation__
 *
 * To run a mutation, you first call `useUpdateContentCardImageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateContentCardImageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateContentCardImageMutation, { data, loading, error }] = useUpdateContentCardImageMutation({
 *   variables: {
 *      id: // value for 'id'
 *      fileName: // value for 'fileName'
 *   },
 * });
 */
export function useUpdateContentCardImageMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateContentCardImageMutation,
    UpdateContentCardImageMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateContentCardImageMutation,
    UpdateContentCardImageMutationVariables
  >(UpdateContentCardImageDocument, options);
}
export type UpdateContentCardImageMutationHookResult = ReturnType<
  typeof useUpdateContentCardImageMutation
>;
export type UpdateContentCardImageMutationResult =
  Apollo.MutationResult<UpdateContentCardImageMutation>;
export type UpdateContentCardImageMutationOptions = Apollo.BaseMutationOptions<
  UpdateContentCardImageMutation,
  UpdateContentCardImageMutationVariables
>;
