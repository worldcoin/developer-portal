/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type ResetApiKeyMutationVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
  team_id: Types.Scalars["String"]["input"];
}>;

export type ResetApiKeyMutation = {
  __typename?: "mutation_root";
  reset_api_key?: { __typename?: "ResetAPIOutput"; api_key: string } | null;
};

export const ResetApiKeyDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "ResetAPIKey" },
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
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "reset_api_key" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "id" },
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
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "api_key" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ResetApiKeyMutation, ResetApiKeyMutationVariables>;
