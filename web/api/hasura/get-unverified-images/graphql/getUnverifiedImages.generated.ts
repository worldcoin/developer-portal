/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetUnverifiedImagesQueryVariables = Types.Exact<{
  team_id: Types.Scalars["String"]["input"];
  app_id: Types.Scalars["String"]["input"];
  user_id: Types.Scalars["String"]["input"];
  locale?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type GetUnverifiedImagesQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    app_metadata: Array<{
      __typename?: "app_metadata";
      logo_img_url: string;
      hero_image_url: string;
      meta_tag_image_url?: string | null;
      showcase_img_urls?: Array<string> | null;
      localisations: Array<{
        __typename?: "localisations";
        hero_image_url: string;
        meta_tag_image_url?: string | null;
        showcase_img_urls?: Array<string> | null;
      }>;
    }>;
    team: {
      __typename?: "team";
      memberships: Array<{
        __typename?: "membership";
        user_id: string;
        role: Types.Role_Enum;
      }>;
    };
  }>;
};

export const GetUnverifiedImagesDocument = gql`
  query GetUnverifiedImages(
    $team_id: String!
    $app_id: String!
    $user_id: String!
    $locale: String
  ) {
    app(
      where: {
        id: { _eq: $app_id }
        team: {
          id: { _eq: $team_id }
          memberships: { user_id: { _eq: $user_id } }
        }
      }
    ) {
      app_metadata(where: { verification_status: { _neq: "verified" } }) {
        logo_img_url
        hero_image_url
        meta_tag_image_url
        showcase_img_urls
        localisations(where: { locale: { _eq: $locale } }) {
          hero_image_url
          meta_tag_image_url
          showcase_img_urls
        }
      }
      team {
        memberships {
          user_id
          role
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
    GetUnverifiedImages(
      variables: GetUnverifiedImagesQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetUnverifiedImagesQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetUnverifiedImagesQuery>(
            GetUnverifiedImagesDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetUnverifiedImages",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
