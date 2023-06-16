/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import { DocumentNode } from "graphql";
export type CreateUserAndDeleteInviteMutationVariables = Types.Exact<{
  email: Types.Scalars["String"];
  team_id: Types.Scalars["String"];
  nullifier: Types.Scalars["String"];
  ironclad_id: Types.Scalars["String"];
  invite_id: Types.Scalars["String"];
}>;

export type CreateUserAndDeleteInviteMutation = {
  __typename?: "mutation_root";
  user?: { __typename?: "user"; id: string; team_id: string } | null;
  delete_invite_by_pk?: { __typename?: "invite"; id: string } | null;
};

export const CreateUserAndDeleteInviteDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "CreateUserAndDeleteInvite" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "email" },
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
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "nullifier" },
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
            name: { kind: "Name", value: "ironclad_id" },
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
            name: { kind: "Name", value: "invite_id" },
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
            alias: { kind: "Name", value: "user" },
            name: { kind: "Name", value: "insert_user_one" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "object" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "email" },
                      value: {
                        kind: "Variable",
                        name: { kind: "Name", value: "email" },
                      },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "team_id" },
                      value: {
                        kind: "Variable",
                        name: { kind: "Name", value: "team_id" },
                      },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "world_id_nullifier" },
                      value: {
                        kind: "Variable",
                        name: { kind: "Name", value: "nullifier" },
                      },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "ironclad_id" },
                      value: {
                        kind: "Variable",
                        name: { kind: "Name", value: "ironclad_id" },
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
              ],
            },
          },
          {
            kind: "Field",
            name: { kind: "Name", value: "delete_invite_by_pk" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "id" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "invite_id" },
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType
) => action();

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper
) {
  return {
    CreateUserAndDeleteInvite(
      variables: CreateUserAndDeleteInviteMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders
    ): Promise<CreateUserAndDeleteInviteMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CreateUserAndDeleteInviteMutation>(
            CreateUserAndDeleteInviteDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders }
          ),
        "CreateUserAndDeleteInvite",
        "mutation"
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
