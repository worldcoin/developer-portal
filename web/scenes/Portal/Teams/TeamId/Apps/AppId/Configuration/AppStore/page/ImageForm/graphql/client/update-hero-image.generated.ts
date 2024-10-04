/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpdateHeroImageMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  hero_image_url: Types.Scalars["String"]["input"];
}>;

export type UpdateHeroImageMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
};

export const UpdateHeroImageDocument = gql`
  mutation UpdateHeroImage(
    $app_metadata_id: String!
    $hero_image_url: String!
  ) {
    update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: { hero_image_url: $hero_image_url }
    ) {
      id
    }
  }
`;
export type UpdateHeroImageMutationFn = Apollo.MutationFunction<
  UpdateHeroImageMutation,
  UpdateHeroImageMutationVariables
>;

/**
 * __useUpdateHeroImageMutation__
 *
 * To run a mutation, you first call `useUpdateHeroImageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateHeroImageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateHeroImageMutation, { data, loading, error }] = useUpdateHeroImageMutation({
 *   variables: {
 *      app_metadata_id: // value for 'app_metadata_id'
 *      hero_image_url: // value for 'hero_image_url'
 *   },
 * });
 */
export function useUpdateHeroImageMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateHeroImageMutation,
    UpdateHeroImageMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateHeroImageMutation,
    UpdateHeroImageMutationVariables
  >(UpdateHeroImageDocument, options);
}
export type UpdateHeroImageMutationHookResult = ReturnType<
  typeof useUpdateHeroImageMutation
>;
export type UpdateHeroImageMutationResult =
  Apollo.MutationResult<UpdateHeroImageMutation>;
export type UpdateHeroImageMutationOptions = Apollo.BaseMutationOptions<
  UpdateHeroImageMutation,
  UpdateHeroImageMutationVariables
>;
