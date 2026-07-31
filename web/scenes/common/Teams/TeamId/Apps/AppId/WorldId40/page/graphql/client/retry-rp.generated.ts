/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type RetryRpMutationVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  environment: Types.Scalars["String"]["input"];
}>;

export type RetryRpMutation = {
  __typename?: "mutation_root";
  retry_rp?: {
    __typename?: "RetryRpOutput";
    success: boolean;
    environment: string;
    operation_hash?: string | null;
  } | null;
};

export const RetryRpDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "RetryRp" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "rp_id" },
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
            name: { kind: "Name", value: "environment" },
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
            name: { kind: "Name", value: "retry_rp" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "rp_id" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "rp_id" },
                },
              },
              {
                kind: "Argument",
                name: { kind: "Name", value: "environment" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "environment" },
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "success" } },
                { kind: "Field", name: { kind: "Name", value: "environment" } },
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
} as unknown as DocumentNode<RetryRpMutation, RetryRpMutationVariables>;
