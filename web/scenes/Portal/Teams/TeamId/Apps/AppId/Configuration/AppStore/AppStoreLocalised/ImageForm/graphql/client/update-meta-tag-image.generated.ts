/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpdateMetaTagImageMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  meta_tag_image_url: Types.Scalars["String"]["input"];
}>;

export type UpdateMetaTagImageMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
};

export const UpdateMetaTagImageDocument = gql`
  mutation UpdateMetaTagImage(
    $app_metadata_id: String!
    $meta_tag_image_url: String!
  ) {
    update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: { meta_tag_image_url: $meta_tag_image_url }
    ) {
      id
    }
  }
`;
export type UpdateMetaTagImageMutationFn = Apollo.MutationFunction<
  UpdateMetaTagImageMutation,
  UpdateMetaTagImageMutationVariables
>;

/**
 * __useUpdateMetaTagImageMutation__
 *
 * To run a mutation, you first call `useUpdateMetaTagImageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateMetaTagImageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateMetaTagImageMutation, { data, loading, error }] = useUpdateMetaTagImageMutation({
 *   variables: {
 *      app_metadata_id: // value for 'app_metadata_id'
 *      meta_tag_image_url: // value for 'meta_tag_image_url'
 *   },
 * });
 */
export function useUpdateMetaTagImageMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateMetaTagImageMutation,
    UpdateMetaTagImageMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateMetaTagImageMutation,
    UpdateMetaTagImageMutationVariables
  >(UpdateMetaTagImageDocument, options);
}
export type UpdateMetaTagImageMutationHookResult = ReturnType<
  typeof useUpdateMetaTagImageMutation
>;
export type UpdateMetaTagImageMutationResult =
  Apollo.MutationResult<UpdateMetaTagImageMutation>;
export type UpdateMetaTagImageMutationOptions = Apollo.BaseMutationOptions<
  UpdateMetaTagImageMutation,
  UpdateMetaTagImageMutationVariables
>;
