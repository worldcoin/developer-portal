/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type RotateSignerKeyMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  new_signer_address: Types.Scalars["String"]["input"];
}>;

export type RotateSignerKeyMutation = {
  __typename?: "mutation_root";
  rotate_signer_key?: {
    __typename?: "RotateSignerKeyOutput";
    rp_id: string;
    new_signer_address: string;
    old_signer_address: string;
    status: string;
    operation_hash?: string | null;
  } | null;
};

export const RotateSignerKeyDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "RotateSignerKey" },
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
            name: { kind: "Name", value: "new_signer_address" },
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
            name: { kind: "Name", value: "rotate_signer_key" },
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
                name: { kind: "Name", value: "new_signer_address" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "new_signer_address" },
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "rp_id" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "new_signer_address" },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "old_signer_address" },
                },
                { kind: "Field", name: { kind: "Name", value: "status" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "operation_hash" },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  RotateSignerKeyMutation,
  RotateSignerKeyMutationVariables
>;
