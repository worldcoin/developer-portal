/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type RegisterRpMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  mode?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  signer_address?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type RegisterRpMutation = {
  __typename?: "mutation_root";
  register_rp?: {
    __typename?: "RegisterRpOutput";
    rp_id: string;
    manager_address?: string | null;
    signer_address?: string | null;
    status: string;
    operation_hash?: string | null;
  } | null;
};

export const RegisterRpDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "RegisterRp" },
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
          variable: { kind: "Variable", name: { kind: "Name", value: "mode" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "String" } },
        },
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "signer_address" },
          },
          type: { kind: "NamedType", name: { kind: "Name", value: "String" } },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "register_rp" },
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
                name: { kind: "Name", value: "mode" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "mode" },
                },
              },
              {
                kind: "Argument",
                name: { kind: "Name", value: "signer_address" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "signer_address" },
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "rp_id" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "manager_address" },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "signer_address" },
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
} as unknown as DocumentNode<RegisterRpMutation, RegisterRpMutationVariables>;
