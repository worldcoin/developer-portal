/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type FetchAppMetadataQueryVariables = Types.Exact<{
  id: Types.Scalars["String"];
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
      showcase_img_urls?: any | null;
      hero_image_url: string;
      description: string;
      world_app_description: string;
      category: string;
      is_developer_allow_listing: boolean;
      world_app_button_text: string;
      integration_url: string;
      app_website_url: string;
      source_code_url: string;
      verified_at?: any | null;
      review_message: string;
      verification_status: string;
      app_mode: string;
      whitelisted_addresses?: any | null;
      support_email?: string | null;
      supported_countries?: any | null;
    }>;
    verified_app_metadata: Array<{
      __typename?: "app_metadata";
      id: string;
      app_id: string;
      name: string;
      logo_img_url: string;
      showcase_img_urls?: any | null;
      hero_image_url: string;
      description: string;
      world_app_description: string;
      category: string;
      is_developer_allow_listing: boolean;
      world_app_button_text: string;
      integration_url: string;
      app_website_url: string;
      source_code_url: string;
      verified_at?: any | null;
      review_message: string;
      verification_status: string;
      app_mode: string;
      whitelisted_addresses?: any | null;
      support_email?: string | null;
      supported_countries?: any | null;
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
        support_email
        supported_countries
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
        support_email
        supported_countries
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
  >,
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
export type FetchAppMetadataQueryHookResult = ReturnType<
  typeof useFetchAppMetadataQuery
>;
export type FetchAppMetadataLazyQueryHookResult = ReturnType<
  typeof useFetchAppMetadataLazyQuery
>;
export type FetchAppMetadataQueryResult = Apollo.QueryResult<
  FetchAppMetadataQuery,
  FetchAppMetadataQueryVariables
>;
