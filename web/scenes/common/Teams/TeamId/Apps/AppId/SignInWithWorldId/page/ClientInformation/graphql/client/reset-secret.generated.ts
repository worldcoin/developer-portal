/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type ResetClientSecretMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  team_id: Types.Scalars["String"]["input"];
}>;

export type ResetClientSecretMutation = {
  __typename?: "mutation_root";
  reset_client_secret?: {
    __typename?: "ResetClientOutput";
    client_secret: string;
  } | null;
};

export const ResetClientSecretDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "ResetClientSecret" },
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
            name: { kind: "Name", value: "reset_client_secret" },
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
                {
                  kind: "Field",
                  name: { kind: "Name", value: "client_secret" },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  ResetClientSecretMutation,
  ResetClientSecretMutationVariables
>;
