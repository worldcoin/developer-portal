/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpsertLocalisedMetaTagImageMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  meta_tag_image_url: Types.Scalars["String"]["input"];
  supported_languages:
    | Array<Types.Scalars["String"]["input"]>
    | Types.Scalars["String"]["input"];
  locale?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  is_localized: Types.Scalars["Boolean"]["input"];
}>;

export type UpsertLocalisedMetaTagImageMutation = {
  __typename?: "mutation_root";
  update_supported_languages?: {
    __typename?: "app_metadata";
    id: string;
    supported_languages?: Array<string> | null;
  } | null;
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
    meta_tag_image_url: string;
  } | null;
  insert_localisations?: {
    __typename?: "localisations_mutation_response";
    affected_rows: number;
  } | null;
};

export const UpsertLocalisedMetaTagImageDocument = gql`
  mutation UpsertLocalisedMetaTagImage(
    $app_metadata_id: String!
    $meta_tag_image_url: String!
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
      _set: { meta_tag_image_url: $meta_tag_image_url }
    ) @skip(if: $is_localized) {
      id
      meta_tag_image_url
    }
    insert_localisations(
      objects: [
        {
          app_metadata_id: $app_metadata_id
          locale: $locale
          meta_tag_image_url: $meta_tag_image_url
        }
      ]
      on_conflict: {
        constraint: unique_app_metadata_locale
        update_columns: meta_tag_image_url
      }
    ) @include(if: $is_localized) {
      affected_rows
    }
  }
`;
export type UpsertLocalisedMetaTagImageMutationFn = Apollo.MutationFunction<
  UpsertLocalisedMetaTagImageMutation,
  UpsertLocalisedMetaTagImageMutationVariables
>;

/**
 * __useUpsertLocalisedMetaTagImageMutation__
 *
 * To run a mutation, you first call `useUpsertLocalisedMetaTagImageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpsertLocalisedMetaTagImageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [upsertLocalisedMetaTagImageMutation, { data, loading, error }] = useUpsertLocalisedMetaTagImageMutation({
 *   variables: {
 *      app_metadata_id: // value for 'app_metadata_id'
 *      meta_tag_image_url: // value for 'meta_tag_image_url'
 *      supported_languages: // value for 'supported_languages'
 *      locale: // value for 'locale'
 *      is_localized: // value for 'is_localized'
 *   },
 * });
 */
export function useUpsertLocalisedMetaTagImageMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpsertLocalisedMetaTagImageMutation,
    UpsertLocalisedMetaTagImageMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpsertLocalisedMetaTagImageMutation,
    UpsertLocalisedMetaTagImageMutationVariables
  >(UpsertLocalisedMetaTagImageDocument, options);
}
export type UpsertLocalisedMetaTagImageMutationHookResult = ReturnType<
  typeof useUpsertLocalisedMetaTagImageMutation
>;
export type UpsertLocalisedMetaTagImageMutationResult =
  Apollo.MutationResult<UpsertLocalisedMetaTagImageMutation>;
export type UpsertLocalisedMetaTagImageMutationOptions =
  Apollo.BaseMutationOptions<
    UpsertLocalisedMetaTagImageMutation,
    UpsertLocalisedMetaTagImageMutationVariables
  >;
