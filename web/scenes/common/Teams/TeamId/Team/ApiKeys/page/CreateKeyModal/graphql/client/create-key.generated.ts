/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type InsertKeyMutationVariables = Types.Exact<{
  name: Types.Scalars["String"]["input"];
  teamId: Types.Scalars["String"]["input"];
}>;

export type InsertKeyMutation = {
  __typename?: "mutation_root";
  insert_api_key_one?: {
    __typename?: "api_key";
    id: string;
    team_id: string;
    created_at: string;
    updated_at: string;
    is_active: boolean;
    name: string;
  } | null;
};

export const InsertKeyDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "InsertKey" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "name" } },
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
            name: { kind: "Name", value: "teamId" },
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
            name: { kind: "Name", value: "insert_api_key_one" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "object" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "name" },
                      value: {
                        kind: "Variable",
                        name: { kind: "Name", value: "name" },
                      },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "team_id" },
                      value: {
                        kind: "Variable",
                        name: { kind: "Name", value: "teamId" },
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
                { kind: "Field", name: { kind: "Name", value: "team_id" } },
                { kind: "Field", name: { kind: "Name", value: "created_at" } },
                { kind: "Field", name: { kind: "Name", value: "updated_at" } },
                { kind: "Field", name: { kind: "Name", value: "is_active" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<InsertKeyMutation, InsertKeyMutationVariables>;
