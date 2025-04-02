/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpdateLocalisationHeroImageMutationVariables = Types.Exact<{
  localisation_id: Types.Scalars["String"]["input"];
  hero_image_url: Types.Scalars["String"]["input"];
}>;

export type UpdateLocalisationHeroImageMutation = {
  __typename?: "mutation_root";
  update_localisations_by_pk?: {
    __typename?: "localisations";
    id: string;
  } | null;
};

export const UpdateLocalisationHeroImageDocument = gql`
  mutation UpdateLocalisationHeroImage(
    $localisation_id: String!
    $hero_image_url: String!
  ) {
    update_localisations_by_pk(
      pk_columns: { id: $localisation_id }
      _set: { hero_image_url: $hero_image_url }
    ) {
      id
    }
  }
`;
export type UpdateLocalisationHeroImageMutationFn = Apollo.MutationFunction<
  UpdateLocalisationHeroImageMutation,
  UpdateLocalisationHeroImageMutationVariables
>;

/**
 * __useUpdateLocalisationHeroImageMutation__
 *
 * To run a mutation, you first call `useUpdateLocalisationHeroImageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateLocalisationHeroImageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateLocalisationHeroImageMutation, { data, loading, error }] = useUpdateLocalisationHeroImageMutation({
 *   variables: {
 *      localisation_id: // value for 'localisation_id'
 *      hero_image_url: // value for 'hero_image_url'
 *   },
 * });
 */
export function useUpdateLocalisationHeroImageMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateLocalisationHeroImageMutation,
    UpdateLocalisationHeroImageMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateLocalisationHeroImageMutation,
    UpdateLocalisationHeroImageMutationVariables
  >(UpdateLocalisationHeroImageDocument, options);
}
export type UpdateLocalisationHeroImageMutationHookResult = ReturnType<
  typeof useUpdateLocalisationHeroImageMutation
>;
export type UpdateLocalisationHeroImageMutationResult =
  Apollo.MutationResult<UpdateLocalisationHeroImageMutation>;
export type UpdateLocalisationHeroImageMutationOptions =
  Apollo.BaseMutationOptions<
    UpdateLocalisationHeroImageMutation,
    UpdateLocalisationHeroImageMutationVariables
  >;
