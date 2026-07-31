/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type InsertRedirectMutationVariables = Types.Exact<{
  action_id: Types.Scalars["String"]["input"];
  uri: Types.Scalars["String"]["input"];
}>;

export type InsertRedirectMutation = {
  __typename?: "mutation_root";
  insert_redirect_one?: {
    __typename?: "redirect";
    id: string;
    action_id: string;
    redirect_uri: string;
    created_at: string;
    updated_at: string;
  } | null;
};

export const InsertRedirectDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "InsertRedirect" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "action_id" },
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
          variable: { kind: "Variable", name: { kind: "Name", value: "uri" } },
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
            name: { kind: "Name", value: "insert_redirect_one" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "object" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "action_id" },
                      value: {
                        kind: "Variable",
                        name: { kind: "Name", value: "action_id" },
                      },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "redirect_uri" },
                      value: {
                        kind: "Variable",
                        name: { kind: "Name", value: "uri" },
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
                { kind: "Field", name: { kind: "Name", value: "action_id" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "redirect_uri" },
                },
                { kind: "Field", name: { kind: "Name", value: "created_at" } },
                { kind: "Field", name: { kind: "Name", value: "updated_at" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  InsertRedirectMutation,
  InsertRedirectMutationVariables
>;
