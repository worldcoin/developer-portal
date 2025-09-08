/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetAppReviewImagesQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  locale?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type GetAppReviewImagesQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    app_metadata: Array<{
      __typename?: "app_metadata";
      logo_img_url: string;
      hero_image_url: string;
      meta_tag_image_url: string;
      showcase_img_urls?: Array<string> | null;
      content_card_image_url: string;
      localisations: Array<{
        __typename?: "localisations";
        hero_image_url: string;
        meta_tag_image_url: string;
        showcase_img_urls?: Array<string> | null;
      }>;
    }>;
  }>;
};

export const GetAppReviewImagesDocument = gql`
  query GetAppReviewImages($app_id: String!, $locale: String) {
    app(where: { id: { _eq: $app_id } }) {
      app_metadata(where: { verification_status: { _eq: "awaiting_review" } }) {
        logo_img_url
        hero_image_url
        meta_tag_image_url
        showcase_img_urls
        content_card_image_url
        localisations(where: { locale: { _eq: $locale } }) {
          hero_image_url
          meta_tag_image_url
          showcase_img_urls
        }
      }
    }
  }
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
    GetAppReviewImages(
      variables: GetAppReviewImagesQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetAppReviewImagesQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetAppReviewImagesQuery>(
            GetAppReviewImagesDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetAppReviewImages",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
