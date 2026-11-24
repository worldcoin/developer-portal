/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type UploadImageQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  image_type: Types.Scalars["String"]["input"];
  content_type_ending: Types.Scalars["String"]["input"];
  team_id: Types.Scalars["String"]["input"];
  locale?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type UploadImageQuery = {
  __typename?: "query_root";
  upload_image?: {
    __typename?: "PresignedPostOutput";
    url: string;
    stringifiedFields: string;
  } | null;
};

export const UploadImageDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "UploadImage" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "app_id" },
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
            name: { kind: "Name", value: "image_type" },
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
            name: { kind: "Name", value: "content_type_ending" },
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
            name: { kind: "Name", value: "upload_image" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "app_id" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "app_id" },
                },
              },
              {
                kind: "Argument",
                name: { kind: "Name", value: "image_type" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "image_type" },
                },
              },
              {
                kind: "Argument",
                name: { kind: "Name", value: "content_type_ending" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "content_type_ending" },
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
                { kind: "Field", name: { kind: "Name", value: "url" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "stringifiedFields" },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UploadImageQuery, UploadImageQueryVariables>;
