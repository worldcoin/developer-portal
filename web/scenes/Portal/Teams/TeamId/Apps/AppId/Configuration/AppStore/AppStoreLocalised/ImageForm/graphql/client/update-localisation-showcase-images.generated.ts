/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpdateLocalisationShowcaseImagesMutationVariables = Types.Exact<{
  localisation_id: Types.Scalars["String"]["input"];
  showcase_img_urls?: Types.InputMaybe<
    Array<Types.Scalars["String"]["input"]> | Types.Scalars["String"]["input"]
  >;
}>;

export type UpdateLocalisationShowcaseImagesMutation = {
  __typename?: "mutation_root";
  update_localisations_by_pk?: {
    __typename?: "localisations";
    id: string;
  } | null;
};

export const UpdateLocalisationShowcaseImagesDocument = gql`
  mutation UpdateLocalisationShowcaseImages(
    $localisation_id: String!
    $showcase_img_urls: [String!]
  ) {
    update_localisations_by_pk(
      pk_columns: { id: $localisation_id }
      _set: { showcase_img_urls: $showcase_img_urls }
    ) {
      id
    }
  }
`;
export type UpdateLocalisationShowcaseImagesMutationFn =
  Apollo.MutationFunction<
    UpdateLocalisationShowcaseImagesMutation,
    UpdateLocalisationShowcaseImagesMutationVariables
  >;

/**
 * __useUpdateLocalisationShowcaseImagesMutation__
 *
 * To run a mutation, you first call `useUpdateLocalisationShowcaseImagesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateLocalisationShowcaseImagesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateLocalisationShowcaseImagesMutation, { data, loading, error }] = useUpdateLocalisationShowcaseImagesMutation({
 *   variables: {
 *      localisation_id: // value for 'localisation_id'
 *      showcase_img_urls: // value for 'showcase_img_urls'
 *   },
 * });
 */
export function useUpdateLocalisationShowcaseImagesMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateLocalisationShowcaseImagesMutation,
    UpdateLocalisationShowcaseImagesMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateLocalisationShowcaseImagesMutation,
    UpdateLocalisationShowcaseImagesMutationVariables
  >(UpdateLocalisationShowcaseImagesDocument, options);
}
export type UpdateLocalisationShowcaseImagesMutationHookResult = ReturnType<
  typeof useUpdateLocalisationShowcaseImagesMutation
>;
export type UpdateLocalisationShowcaseImagesMutationResult =
  Apollo.MutationResult<UpdateLocalisationShowcaseImagesMutation>;
export type UpdateLocalisationShowcaseImagesMutationOptions =
  Apollo.BaseMutationOptions<
    UpdateLocalisationShowcaseImagesMutation,
    UpdateLocalisationShowcaseImagesMutationVariables
  >;
