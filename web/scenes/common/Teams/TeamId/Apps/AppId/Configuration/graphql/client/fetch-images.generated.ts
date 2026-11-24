/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type FetchImagesQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
  team_id: Types.Scalars["String"]["input"];
  locale?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type FetchImagesQuery = {
  __typename?: "query_root";
  unverified_images?: {
    __typename?: "ImageGetAllUnverifiedImagesOutput";
    logo_img_url?: string | null;
    hero_image_url?: string | null;
    meta_tag_image_url?: string | null;
    showcase_img_urls?: Array<string> | null;
    content_card_image_url?: string | null;
  } | null;
};

export const FetchImagesDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "FetchImages" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "id" } },
          type: {
            kind: "NonNullType",
            type: {
              kind: "NamedType",
              name: { kind: "Name", value: "String" },
            },
          },
        },
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "team_id" },
          },
          type: {
            kind: "NonNullType",
            type: {
              kind: "NamedType",
              name: { kind: "Name", value: "String" },
            },
          },
        },
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "locale" },
          },
          type: { kind: "NamedType", name: { kind: "Name", value: "String" } },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            alias: { kind: "Name", value: "unverified_images" },
            name: { kind: "Name", value: "get_all_unverified_images" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "app_id" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "id" },
                },
              },
              {
                kind: "Argument",
                name: { kind: "Name", value: "team_id" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "team_id" },
                },
              },
              {
                kind: "Argument",
                name: { kind: "Name", value: "locale" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "locale" },
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "Field",
                  name: { kind: "Name", value: "logo_img_url" },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "hero_image_url" },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "meta_tag_image_url" },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "showcase_img_urls" },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "content_card_image_url" },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<FetchImagesQuery, FetchImagesQueryVariables>;
