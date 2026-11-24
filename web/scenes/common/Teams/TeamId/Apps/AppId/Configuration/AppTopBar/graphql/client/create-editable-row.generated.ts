/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type CreateEditableRowMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  team_id: Types.Scalars["String"]["input"];
}>;

export type CreateEditableRowMutation = {
  __typename?: "mutation_root";
  create_new_draft?: {
    __typename?: "CreateNewDraftOutput";
    success?: boolean | null;
  } | null;
};

export const CreateEditableRowDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "CreateEditableRow" },
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
            name: { kind: "Name", value: "create_new_draft" },
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
  CreateEditableRowMutation,
  CreateEditableRowMutationVariables
>;
