/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpsertLocalisedShowcaseImagesMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  showcase_img_urls?: Types.InputMaybe<
    Array<Types.Scalars["String"]["input"]> | Types.Scalars["String"]["input"]
  >;
  supported_languages:
    | Array<Types.Scalars["String"]["input"]>
    | Types.Scalars["String"]["input"];
  locale?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  is_localized: Types.Scalars["Boolean"]["input"];
}>;

export type UpsertLocalisedShowcaseImagesMutation = {
  __typename?: "mutation_root";
  update_supported_languages?: {
    __typename?: "app_metadata";
    id: string;
    supported_languages?: Array<string> | null;
  } | null;
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
    showcase_img_urls?: Array<string> | null;
  } | null;
  insert_localisations?: {
    __typename?: "localisations_mutation_response";
    affected_rows: number;
  } | null;
};

export const UpsertLocalisedShowcaseImagesDocument = gql`
  mutation UpsertLocalisedShowcaseImages(
    $app_metadata_id: String!
    $showcase_img_urls: [String!]
    $supported_languages: [String!]!
    $locale: String
    $is_localized: Boolean!
  ) {
    update_supported_languages: update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: { supported_languages: $supported_languages }
    ) {
      id
      supported_languages
    }
    update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: { showcase_img_urls: $showcase_img_urls }
    ) @skip(if: $is_localized) {
      id
      showcase_img_urls
    }
    insert_localisations(
      objects: [
        {
          app_metadata_id: $app_metadata_id
          locale: $locale
          showcase_img_urls: $showcase_img_urls
        }
      ]
      on_conflict: {
        constraint: unique_app_metadata_locale
        update_columns: [showcase_img_urls]
      }
    ) @include(if: $is_localized) {
      affected_rows
    }
  }
`;
export type UpsertLocalisedShowcaseImagesMutationFn = Apollo.MutationFunction<
  UpsertLocalisedShowcaseImagesMutation,
  UpsertLocalisedShowcaseImagesMutationVariables
>;

/**
 * __useUpsertLocalisedShowcaseImagesMutation__
 *
 * To run a mutation, you first call `useUpsertLocalisedShowcaseImagesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpsertLocalisedShowcaseImagesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [upsertLocalisedShowcaseImagesMutation, { data, loading, error }] = useUpsertLocalisedShowcaseImagesMutation({
 *   variables: {
 *      app_metadata_id: // value for 'app_metadata_id'
 *      showcase_img_urls: // value for 'showcase_img_urls'
 *      supported_languages: // value for 'supported_languages'
 *      locale: // value for 'locale'
 *      is_localized: // value for 'is_localized'
 *   },
 * });
 */
export function useUpsertLocalisedShowcaseImagesMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpsertLocalisedShowcaseImagesMutation,
    UpsertLocalisedShowcaseImagesMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpsertLocalisedShowcaseImagesMutation,
    UpsertLocalisedShowcaseImagesMutationVariables
  >(UpsertLocalisedShowcaseImagesDocument, options);
}
export type UpsertLocalisedShowcaseImagesMutationHookResult = ReturnType<
  typeof useUpsertLocalisedShowcaseImagesMutation
>;
export type UpsertLocalisedShowcaseImagesMutationResult =
  Apollo.MutationResult<UpsertLocalisedShowcaseImagesMutation>;
export type UpsertLocalisedShowcaseImagesMutationOptions =
  Apollo.BaseMutationOptions<
    UpsertLocalisedShowcaseImagesMutation,
    UpsertLocalisedShowcaseImagesMutationVariables
  >;
