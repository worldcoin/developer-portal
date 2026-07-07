/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type FetchLocalisationsQueryVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
}>;

export type FetchLocalisationsQuery = {
  __typename?: "query_root";
  localisations: Array<{
    __typename?: "localisations";
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

export const FetchLocalisationsDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "FetchLocalisations" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "app_metadata_id" },
          },
          type: {
            kind: "NonNullType",
            type: {
              kind: "NamedType",
              name: { kind: "Name", value: "String" },
            },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "localisations" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "where" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "app_metadata_id" },
                      value: {
                        kind: "ObjectValue",
                        fields: [
                          {
                            kind: "ObjectField",
                            name: { kind: "Name", value: "_eq" },
                            value: {
                              kind: "Variable",
                              name: { kind: "Name", value: "app_metadata_id" },
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "locale" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                { kind: "Field", name: { kind: "Name", value: "description" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "world_app_button_text" },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "world_app_description" },
                },
                { kind: "Field", name: { kind: "Name", value: "short_name" } },
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
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  FetchLocalisationsQuery,
  FetchLocalisationsQueryVariables
>;
