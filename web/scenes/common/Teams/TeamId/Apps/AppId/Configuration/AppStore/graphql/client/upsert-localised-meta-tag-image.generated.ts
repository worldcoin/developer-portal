/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type UpsertLocalisedMetaTagImageMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  meta_tag_image_url: Types.Scalars["String"]["input"];
  supported_languages:
    | Array<Types.Scalars["String"]["input"]>
    | Types.Scalars["String"]["input"];
  locale?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  is_localized: Types.Scalars["Boolean"]["input"];
}>;

export type UpsertLocalisedMetaTagImageMutation = {
  __typename?: "mutation_root";
  update_supported_languages?: {
    __typename?: "app_metadata";
    id: string;
    supported_languages?: Array<string> | null;
  } | null;
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
    meta_tag_image_url: string;
  } | null;
  insert_localisations?: {
    __typename?: "localisations_mutation_response";
    affected_rows: number;
  } | null;
};

export const UpsertLocalisedMetaTagImageDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "UpsertLocalisedMetaTagImage" },
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
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "meta_tag_image_url" },
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
            name: { kind: "Name", value: "supported_languages" },
          },
          type: {
            kind: "NonNullType",
            type: {
              kind: "ListType",
              type: {
                kind: "NonNullType",
                type: {
                  kind: "NamedType",
                  name: { kind: "Name", value: "String" },
                },
              },
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
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "is_localized" },
          },
          type: {
            kind: "NonNullType",
            type: {
              kind: "NamedType",
              name: { kind: "Name", value: "Boolean" },
            },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            alias: { kind: "Name", value: "update_supported_languages" },
            name: { kind: "Name", value: "update_app_metadata_by_pk" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "pk_columns" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "id" },
                      value: {
                        kind: "Variable",
                        name: { kind: "Name", value: "app_metadata_id" },
                      },
                    },
                  ],
                },
              },
              {
                kind: "Argument",
                name: { kind: "Name", value: "_set" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "supported_languages" },
                      value: {
                        kind: "Variable",
                        name: { kind: "Name", value: "supported_languages" },
                      },
                    },
                  ],
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "supported_languages" },
                },
              ],
            },
          },
          {
            kind: "Field",
            name: { kind: "Name", value: "update_app_metadata_by_pk" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "pk_columns" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "id" },
                      value: {
                        kind: "Variable",
                        name: { kind: "Name", value: "app_metadata_id" },
                      },
                    },
                  ],
                },
              },
              {
                kind: "Argument",
                name: { kind: "Name", value: "_set" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "meta_tag_image_url" },
                      value: {
                        kind: "Variable",
                        name: { kind: "Name", value: "meta_tag_image_url" },
                      },
                    },
                  ],
                },
              },
            ],
            directives: [
              {
                kind: "Directive",
                name: { kind: "Name", value: "skip" },
                arguments: [
                  {
                    kind: "Argument",
                    name: { kind: "Name", value: "if" },
                    value: {
                      kind: "Variable",
                      name: { kind: "Name", value: "is_localized" },
                    },
                  },
                ],
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "meta_tag_image_url" },
                },
              ],
            },
          },
          {
            kind: "Field",
            name: { kind: "Name", value: "insert_localisations" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "objects" },
                value: {
                  kind: "ListValue",
                  values: [
                    {
                      kind: "ObjectValue",
                      fields: [
                        {
                          kind: "ObjectField",
                          name: { kind: "Name", value: "app_metadata_id" },
                          value: {
                            kind: "Variable",
                            name: { kind: "Name", value: "app_metadata_id" },
                          },
                        },
                        {
                          kind: "ObjectField",
                          name: { kind: "Name", value: "locale" },
                          value: {
                            kind: "Variable",
                            name: { kind: "Name", value: "locale" },
                          },
                        },
                        {
                          kind: "ObjectField",
                          name: { kind: "Name", value: "meta_tag_image_url" },
                          value: {
                            kind: "Variable",
                            name: { kind: "Name", value: "meta_tag_image_url" },
                          },
                        },
                      ],
                    },
                  ],
                },
              },
              {
                kind: "Argument",
                name: { kind: "Name", value: "on_conflict" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "constraint" },
                      value: {
                        kind: "EnumValue",
                        value: "unique_app_metadata_locale",
                      },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "update_columns" },
                      value: { kind: "EnumValue", value: "meta_tag_image_url" },
                    },
                  ],
                },
              },
            ],
            directives: [
              {
                kind: "Directive",
                name: { kind: "Name", value: "include" },
                arguments: [
                  {
                    kind: "Argument",
                    name: { kind: "Name", value: "if" },
                    value: {
                      kind: "Variable",
                      name: { kind: "Name", value: "is_localized" },
                    },
                  },
                ],
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "Field",
                  name: { kind: "Name", value: "affected_rows" },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  UpsertLocalisedMetaTagImageMutation,
  UpsertLocalisedMetaTagImageMutationVariables
>;
