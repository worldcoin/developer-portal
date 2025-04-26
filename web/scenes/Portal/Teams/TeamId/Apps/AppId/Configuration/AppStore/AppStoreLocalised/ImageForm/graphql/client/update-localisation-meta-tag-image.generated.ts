/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpdateLocalisationMetaTagImageMutationVariables = Types.Exact<{
  localisation_id: Types.Scalars["String"]["input"];
  meta_tag_image_url: Types.Scalars["String"]["input"];
}>;

export type UpdateLocalisationMetaTagImageMutation = {
  __typename?: "mutation_root";
  update_localisations_by_pk?: {
    __typename?: "localisations";
    id: string;
  } | null;
};

export const UpdateLocalisationMetaTagImageDocument = gql`
  mutation UpdateLocalisationMetaTagImage(
    $localisation_id: String!
    $meta_tag_image_url: String!
  ) {
    update_localisations_by_pk(
      pk_columns: { id: $localisation_id }
      _set: { meta_tag_image_url: $meta_tag_image_url }
    ) {
      id
    }
  }
`;
export type UpdateLocalisationMetaTagImageMutationFn = Apollo.MutationFunction<
  UpdateLocalisationMetaTagImageMutation,
  UpdateLocalisationMetaTagImageMutationVariables
>;

/**
 * __useUpdateLocalisationMetaTagImageMutation__
 *
 * To run a mutation, you first call `useUpdateLocalisationMetaTagImageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateLocalisationMetaTagImageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateLocalisationMetaTagImageMutation, { data, loading, error }] = useUpdateLocalisationMetaTagImageMutation({
 *   variables: {
 *      localisation_id: // value for 'localisation_id'
 *      meta_tag_image_url: // value for 'meta_tag_image_url'
 *   },
 * });
 */
export function useUpdateLocalisationMetaTagImageMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateLocalisationMetaTagImageMutation,
    UpdateLocalisationMetaTagImageMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateLocalisationMetaTagImageMutation,
    UpdateLocalisationMetaTagImageMutationVariables
  >(UpdateLocalisationMetaTagImageDocument, options);
}
export type UpdateLocalisationMetaTagImageMutationHookResult = ReturnType<
  typeof useUpdateLocalisationMetaTagImageMutation
>;
export type UpdateLocalisationMetaTagImageMutationResult =
  Apollo.MutationResult<UpdateLocalisationMetaTagImageMutation>;
export type UpdateLocalisationMetaTagImageMutationOptions =
  Apollo.BaseMutationOptions<
    UpdateLocalisationMetaTagImageMutation,
    UpdateLocalisationMetaTagImageMutationVariables
  >;
