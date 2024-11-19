/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetLatestLayoutAppFragment = {
  __typename?: "layout_app";
  location_index: number;
  app: {
    __typename?: "app";
    name: string;
    app_metadata: Array<{
      __typename?: "app_metadata";
      name: string;
      short_name: string;
      app_id: string;
      logo_img_url: string;
      showcase_img_urls?: Array<string> | null;
      hero_image_url: string;
      world_app_description: string;
      world_app_button_text: string;
      whitelisted_addresses?: Array<string> | null;
      app_mode: string;
      description: string;
      category: string;
      integration_url: string;
      app_website_url: string;
      source_code_url: string;
      support_link: string;
      supported_countries?: Array<string> | null;
      supported_languages?: Array<string> | null;
      associated_domains?: Array<string> | null;
      contracts?: Array<string> | null;
      permit2_tokens?: Array<string> | null;
      can_import_all_contacts: boolean;
      is_reviewer_world_app_approved: boolean;
      verification_status: string;
      localisations: Array<{
        __typename?: "localisations";
        name: string;
        world_app_button_text: string;
        world_app_description: string;
        short_name: string;
        description: string;
      }>;
    }>;
  };
};

export type GetLatestLayoutBannerFragment = {
  __typename?: "layout_banner";
  location_index: number;
  title: string;
  title_color_hex: string;
  subtitle: string;
  subtitle_color_hex: string;
  highlight_color_hex: string;
  background_color_hex?: string | null;
  background_image_url?: string | null;
};

export type GetLatestLayoutQueryVariables = Types.Exact<{
  locale: Types.Scalars["String"]["input"];
}>;

export type GetLatestLayoutQuery = {
  __typename?: "query_root";
  layout: Array<{
    __typename?: "layout";
    id: string;
    layout_categories: Array<{
      __typename?: "layout_category";
      location_index: number;
      category: string;
      layout_apps: Array<{
        __typename?: "layout_app";
        location_index: number;
        app: {
          __typename?: "app";
          name: string;
          app_metadata: Array<{
            __typename?: "app_metadata";
            name: string;
            short_name: string;
            app_id: string;
            logo_img_url: string;
            showcase_img_urls?: Array<string> | null;
            hero_image_url: string;
            world_app_description: string;
            world_app_button_text: string;
            whitelisted_addresses?: Array<string> | null;
            app_mode: string;
            description: string;
            category: string;
            integration_url: string;
            app_website_url: string;
            source_code_url: string;
            support_link: string;
            supported_countries?: Array<string> | null;
            supported_languages?: Array<string> | null;
            associated_domains?: Array<string> | null;
            contracts?: Array<string> | null;
            permit2_tokens?: Array<string> | null;
            can_import_all_contacts: boolean;
            is_reviewer_world_app_approved: boolean;
            verification_status: string;
            localisations: Array<{
              __typename?: "localisations";
              name: string;
              world_app_button_text: string;
              world_app_description: string;
              short_name: string;
              description: string;
            }>;
          }>;
        };
      }>;
      layout_banners: Array<{
        __typename?: "layout_banner";
        location_index: number;
        title: string;
        title_color_hex: string;
        subtitle: string;
        subtitle_color_hex: string;
        highlight_color_hex: string;
        background_color_hex?: string | null;
        background_image_url?: string | null;
      }>;
      layout_app_collections: Array<{
        __typename?: "layout_app_collection";
        location_index: number;
        indexed: boolean;
        title: string;
        layout_apps: Array<{
          __typename?: "layout_app";
          location_index: number;
          app: {
            __typename?: "app";
            name: string;
            app_metadata: Array<{
              __typename?: "app_metadata";
              name: string;
              short_name: string;
              app_id: string;
              logo_img_url: string;
              showcase_img_urls?: Array<string> | null;
              hero_image_url: string;
              world_app_description: string;
              world_app_button_text: string;
              whitelisted_addresses?: Array<string> | null;
              app_mode: string;
              description: string;
              category: string;
              integration_url: string;
              app_website_url: string;
              source_code_url: string;
              support_link: string;
              supported_countries?: Array<string> | null;
              supported_languages?: Array<string> | null;
              associated_domains?: Array<string> | null;
              contracts?: Array<string> | null;
              permit2_tokens?: Array<string> | null;
              can_import_all_contacts: boolean;
              is_reviewer_world_app_approved: boolean;
              verification_status: string;
              localisations: Array<{
                __typename?: "localisations";
                name: string;
                world_app_button_text: string;
                world_app_description: string;
                short_name: string;
                description: string;
              }>;
            }>;
          };
        }>;
      }>;
      layout_banner_collections: Array<{
        __typename?: "layout_banner_collection";
        location_index: number;
        title: string;
        layout_banners: Array<{
          __typename?: "layout_banner";
          background_color_hex?: string | null;
          background_image_url?: string | null;
          location_index: number;
          title: string;
          title_color_hex: string;
          subtitle: string;
          subtitle_color_hex: string;
          highlight_color_hex: string;
        }>;
      }>;
      layout_secondary_categories: Array<{
        __typename?: "layout_secondary_category";
        location_index: number;
        title: string;
        subtitle: string;
        background_color_hex?: string | null;
        background_image_url?: string | null;
        layout_apps: Array<{
          __typename?: "layout_app";
          location_index: number;
          app: {
            __typename?: "app";
            name: string;
            app_metadata: Array<{
              __typename?: "app_metadata";
              name: string;
              short_name: string;
              app_id: string;
              logo_img_url: string;
              showcase_img_urls?: Array<string> | null;
              hero_image_url: string;
              world_app_description: string;
              world_app_button_text: string;
              whitelisted_addresses?: Array<string> | null;
              app_mode: string;
              description: string;
              category: string;
              integration_url: string;
              app_website_url: string;
              source_code_url: string;
              support_link: string;
              supported_countries?: Array<string> | null;
              supported_languages?: Array<string> | null;
              associated_domains?: Array<string> | null;
              contracts?: Array<string> | null;
              permit2_tokens?: Array<string> | null;
              can_import_all_contacts: boolean;
              is_reviewer_world_app_approved: boolean;
              verification_status: string;
              localisations: Array<{
                __typename?: "localisations";
                name: string;
                world_app_button_text: string;
                world_app_description: string;
                short_name: string;
                description: string;
              }>;
            }>;
          };
        }>;
        layout_banners: Array<{
          __typename?: "layout_banner";
          location_index: number;
          title: string;
          title_color_hex: string;
          subtitle: string;
          subtitle_color_hex: string;
          highlight_color_hex: string;
          background_color_hex?: string | null;
          background_image_url?: string | null;
        }>;
        layout_app_collections: Array<{
          __typename?: "layout_app_collection";
          location_index: number;
          indexed: boolean;
          title: string;
          layout_apps: Array<{
            __typename?: "layout_app";
            location_index: number;
            app: {
              __typename?: "app";
              name: string;
              app_metadata: Array<{
                __typename?: "app_metadata";
                name: string;
                short_name: string;
                app_id: string;
                logo_img_url: string;
                showcase_img_urls?: Array<string> | null;
                hero_image_url: string;
                world_app_description: string;
                world_app_button_text: string;
                whitelisted_addresses?: Array<string> | null;
                app_mode: string;
                description: string;
                category: string;
                integration_url: string;
                app_website_url: string;
                source_code_url: string;
                support_link: string;
                supported_countries?: Array<string> | null;
                supported_languages?: Array<string> | null;
                associated_domains?: Array<string> | null;
                contracts?: Array<string> | null;
                permit2_tokens?: Array<string> | null;
                can_import_all_contacts: boolean;
                is_reviewer_world_app_approved: boolean;
                verification_status: string;
                localisations: Array<{
                  __typename?: "localisations";
                  name: string;
                  world_app_button_text: string;
                  world_app_description: string;
                  short_name: string;
                  description: string;
                }>;
              }>;
            };
          }>;
        }>;
        layout_banner_collections: Array<{
          __typename?: "layout_banner_collection";
          location_index: number;
          title: string;
          layout_banners: Array<{
            __typename?: "layout_banner";
            background_color_hex?: string | null;
            background_image_url?: string | null;
            location_index: number;
            title: string;
            title_color_hex: string;
            subtitle: string;
            subtitle_color_hex: string;
            highlight_color_hex: string;
          }>;
        }>;
      }>;
    }>;
  }>;
};

export const GetLatestLayoutAppFragmentDoc = gql`
  fragment GetLatestLayoutApp on layout_app {
    location_index
    app {
      app_metadata {
        name
        short_name
        app_id
        logo_img_url
        showcase_img_urls
        hero_image_url
        world_app_description
        world_app_button_text
        whitelisted_addresses
        app_mode
        description
        category
        integration_url
        app_website_url
        source_code_url
        support_link
        supported_countries
        supported_languages
        associated_domains
        contracts
        permit2_tokens
        can_import_all_contacts
        is_reviewer_world_app_approved
        verification_status
        localisations(where: { locale: { _eq: $locale } }) {
          name
          world_app_button_text
          world_app_description
          short_name
          description
        }
      }
      name
    }
  }
`;
export const GetLatestLayoutBannerFragmentDoc = gql`
  fragment GetLatestLayoutBanner on layout_banner {
    location_index
    title
    title_color_hex
    subtitle
    subtitle_color_hex
    highlight_color_hex
    background_color_hex
    background_image_url
  }
`;
export const GetLatestLayoutDocument = gql`
  query GetLatestLayout($locale: String!) {
    layout(order_by: { created_at: desc }, limit: 1) {
      id
      layout_categories {
        location_index
        category
        layout_apps {
          location_index
          ...GetLatestLayoutApp
        }
        layout_banners {
          location_index
          ...GetLatestLayoutBanner
        }
        layout_app_collections {
          location_index
          indexed
          title
          layout_apps {
            ...GetLatestLayoutApp
          }
        }
        layout_banner_collections {
          location_index
          title
          layout_banners {
            background_color_hex
            background_image_url
            ...GetLatestLayoutBanner
          }
        }
        layout_secondary_categories {
          location_index
          title
          subtitle
          background_color_hex
          background_image_url
          layout_apps {
            location_index
            ...GetLatestLayoutApp
          }
          layout_banners {
            location_index
            ...GetLatestLayoutBanner
          }
          layout_app_collections {
            location_index
            indexed
            title
            layout_apps {
              ...GetLatestLayoutApp
            }
          }
          layout_banner_collections {
            location_index
            title
            layout_banners {
              background_color_hex
              background_image_url
              ...GetLatestLayoutBanner
            }
          }
        }
      }
    }
  }
  ${GetLatestLayoutAppFragmentDoc}
  ${GetLatestLayoutBannerFragmentDoc}
`;

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string,
  variables?: any,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType,
  _variables,
) => action();

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper,
) {
  return {
    GetLatestLayout(
      variables: GetLatestLayoutQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetLatestLayoutQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetLatestLayoutQuery>(
            GetLatestLayoutDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetLatestLayout",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
