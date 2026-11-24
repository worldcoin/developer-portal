/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchLocalizationsQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type FetchLocalizationsQuery = {
  __typename?: "query_root";
  localisations: Array<{
    __typename?: "localisations";
    id: string;
    app_metadata_id: string;
    locale: string;
    name: string;
    description: string;
    world_app_button_text: string;
    world_app_description: string;
    short_name: string;
    hero_image_url: string;
    meta_tag_image_url: string;
    showcase_img_urls?: Array<string> | null;
  }>;
};

export const FetchLocalizationsDocument = gql`
  query FetchLocalizations($id: String!) {
    localisations(where: { app_metadata_id: { _eq: $id } }) {
      id
      app_metadata_id
      locale
      name
      description
      world_app_button_text
      world_app_description
      short_name
      hero_image_url
      meta_tag_image_url
      showcase_img_urls
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
    FetchLocalizations(
      variables: FetchLocalizationsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchLocalizationsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchLocalizationsQuery>(
            FetchLocalizationsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchLocalizations",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
