/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpdateShowcaseImagesMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"];
  showcase_img_urls?: Types.InputMaybe<Types.Scalars["_text"]>;
}>;

export type UpdateShowcaseImagesMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
};

export const UpdateShowcaseImagesDocument = gql`
  mutation UpdateShowcaseImages(
    $app_metadata_id: String!
    $showcase_img_urls: _text
  ) {
    update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: { showcase_img_urls: $showcase_img_urls }
    ) {
      id
    }
  }
`;
export type UpdateShowcaseImagesMutationFn = Apollo.MutationFunction<
  UpdateShowcaseImagesMutation,
  UpdateShowcaseImagesMutationVariables
>;

/**
 * __useUpdateShowcaseImagesMutation__
 *
 * To run a mutation, you first call `useUpdateShowcaseImagesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateShowcaseImagesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateShowcaseImagesMutation, { data, loading, error }] = useUpdateShowcaseImagesMutation({
 *   variables: {
 *      app_metadata_id: // value for 'app_metadata_id'
 *      showcase_img_urls: // value for 'showcase_img_urls'
 *   },
 * });
 */
export function useUpdateShowcaseImagesMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateShowcaseImagesMutation,
    UpdateShowcaseImagesMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateShowcaseImagesMutation,
    UpdateShowcaseImagesMutationVariables
  >(UpdateShowcaseImagesDocument, options);
}
export type UpdateShowcaseImagesMutationHookResult = ReturnType<
  typeof useUpdateShowcaseImagesMutation
>;
export type UpdateShowcaseImagesMutationResult =
  Apollo.MutationResult<UpdateShowcaseImagesMutation>;
export type UpdateShowcaseImagesMutationOptions = Apollo.BaseMutationOptions<
  UpdateShowcaseImagesMutation,
  UpdateShowcaseImagesMutationVariables
>;
