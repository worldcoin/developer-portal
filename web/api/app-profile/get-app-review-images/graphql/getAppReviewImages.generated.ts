/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type GetAppReviewImagesQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"];
}>;

export type GetAppReviewImagesQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    app_metadata: Array<{
      __typename?: "app_metadata";
      logo_img_url: string;
      showcase_img_urls?: Array<string> | null;
      hero_image_url: string;
    }>;
  }>;
};

export const GetAppReviewImagesDocument = gql`
  query GetAppReviewImages($app_id: String!) {
    app(where: { id: { _eq: $app_id } }) {
      app_metadata(where: { verification_status: { _eq: "awaiting_review" } }) {
        logo_img_url
        showcase_img_urls
        hero_image_url
      }
    }
  }
`;

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType,
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
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
