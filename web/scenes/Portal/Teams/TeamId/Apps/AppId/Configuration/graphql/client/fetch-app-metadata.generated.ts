/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type FetchAppMetadataQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type FetchAppMetadataQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    id: string;
    engine: string;
    is_staging: boolean;
    status: string;
    app_metadata: Array<{
      __typename?: "app_metadata";
      id: string;
      app_id: string;
      name: string;
      logo_img_url: string;
      showcase_img_urls?: Array<string> | null;
      hero_image_url: string;
      description: string;
      world_app_description: string;
      category: string;
      is_developer_allow_listing: boolean;
      world_app_button_text: string;
      integration_url: string;
      app_website_url: string;
      source_code_url: string;
      verified_at?: string | null;
      review_message: string;
      verification_status: string;
      app_mode: string;
      whitelisted_addresses?: Array<string> | null;
      support_link: string;
      supported_countries?: Array<string> | null;
      supported_languages?: Array<string> | null;
      short_name: string;
      associated_domains?: Array<string> | null;
      contracts?: Array<string> | null;
      permit2_tokens?: Array<string> | null;
      can_import_all_contacts: boolean;
      is_allowed_unlimited_notifications?: boolean | null;
      max_notifications_per_day?: number | null;
      is_android_only: boolean;
    }>;
    verified_app_metadata: Array<{
      __typename?: "app_metadata";
      id: string;
      app_id: string;
      name: string;
      logo_img_url: string;
      showcase_img_urls?: Array<string> | null;
      hero_image_url: string;
      description: string;
      world_app_description: string;
      category: string;
      is_developer_allow_listing: boolean;
      world_app_button_text: string;
      integration_url: string;
      app_website_url: string;
      source_code_url: string;
      verified_at?: string | null;
      review_message: string;
      verification_status: string;
      app_mode: string;
      whitelisted_addresses?: Array<string> | null;
      support_link: string;
      supported_countries?: Array<string> | null;
      supported_languages?: Array<string> | null;
      short_name: string;
      associated_domains?: Array<string> | null;
      contracts?: Array<string> | null;
      permit2_tokens?: Array<string> | null;
      can_import_all_contacts: boolean;
      is_allowed_unlimited_notifications?: boolean | null;
      max_notifications_per_day?: number | null;
      is_android_only: boolean;
      is_for_humans_only: boolean;
    }>;
  }>;
};

export const FetchAppMetadataDocument = gql`
  query FetchAppMetadata($id: String!) {
    app(where: { id: { _eq: $id } }) {
      id
      engine
      is_staging
      status
      app_metadata(where: { verification_status: { _neq: "verified" } }) {
        id
        app_id
        name
        logo_img_url
        showcase_img_urls
        hero_image_url
        description
        world_app_description
        category
        is_developer_allow_listing
        world_app_button_text
        integration_url
        app_website_url
        source_code_url
        verified_at
        review_message
        verification_status
        app_mode
        whitelisted_addresses
        support_link
        supported_countries
        supported_languages
        short_name
        associated_domains
        contracts
        permit2_tokens
        can_import_all_contacts
        is_allowed_unlimited_notifications
        max_notifications_per_day
        is_android_only
      }
      verified_app_metadata: app_metadata(
        where: { verification_status: { _eq: "verified" } }
      ) {
        id
        app_id
        name
        logo_img_url
        showcase_img_urls
        hero_image_url
        description
        world_app_description
        category
        is_developer_allow_listing
        world_app_button_text
        integration_url
        app_website_url
        source_code_url
        verified_at
        review_message
        verification_status
        app_mode
        whitelisted_addresses
        support_link
        supported_countries
        supported_languages
        short_name
        associated_domains
        contracts
        permit2_tokens
        can_import_all_contacts
        is_allowed_unlimited_notifications
        max_notifications_per_day
        is_android_only
        is_for_humans_only
      }
    }
  }
`;

/**
 * __useFetchAppMetadataQuery__
 *
 * To run a query within a React component, call `useFetchAppMetadataQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchAppMetadataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchAppMetadataQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useFetchAppMetadataQuery(
  baseOptions: Apollo.QueryHookOptions<
    FetchAppMetadataQuery,
    FetchAppMetadataQueryVariables
  > &
    (
      | { variables: FetchAppMetadataQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<FetchAppMetadataQuery, FetchAppMetadataQueryVariables>(
    FetchAppMetadataDocument,
    options,
  );
}
export function useFetchAppMetadataLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    FetchAppMetadataQuery,
    FetchAppMetadataQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    FetchAppMetadataQuery,
    FetchAppMetadataQueryVariables
  >(FetchAppMetadataDocument, options);
}
export function useFetchAppMetadataSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        FetchAppMetadataQuery,
        FetchAppMetadataQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    FetchAppMetadataQuery,
    FetchAppMetadataQueryVariables
  >(FetchAppMetadataDocument, options);
}
export type FetchAppMetadataQueryHookResult = ReturnType<
  typeof useFetchAppMetadataQuery
>;
export type FetchAppMetadataLazyQueryHookResult = ReturnType<
  typeof useFetchAppMetadataLazyQuery
>;
export type FetchAppMetadataSuspenseQueryHookResult = ReturnType<
  typeof useFetchAppMetadataSuspenseQuery
>;
export type FetchAppMetadataQueryResult = Apollo.QueryResult<
  FetchAppMetadataQuery,
  FetchAppMetadataQueryVariables
>;
