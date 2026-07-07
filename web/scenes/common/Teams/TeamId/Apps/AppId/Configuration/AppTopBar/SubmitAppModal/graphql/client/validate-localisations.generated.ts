/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type ValidateLocalisationMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  team_id: Types.Scalars["String"]["input"];
}>;

export type ValidateLocalisationMutation = {
  __typename?: "mutation_root";
  validate_localisation?: {
    __typename?: "ValidateLocalisationOutput";
    success?: boolean | null;
  } | null;
};

export const ValidateLocalisationDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "ValidateLocalisation" },
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
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "validate_localisation" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "app_metadata_id" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "app_metadata_id" },
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
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "success" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  ValidateLocalisationMutation,
  ValidateLocalisationMutationVariables
>;
