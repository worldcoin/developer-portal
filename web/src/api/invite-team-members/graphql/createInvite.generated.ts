/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import { DocumentNode } from "graphql";
export type CreateInvitesMutationVariables = Types.Exact<{
  objects: Array<Types.Invite_Insert_Input> | Types.Invite_Insert_Input;
}>;

export type CreateInvitesMutation = {
  __typename?: "mutation_root";
  invites?: {
    __typename?: "invite_mutation_response";
    returning: Array<{ __typename?: "invite"; id: string; email: string }>;
  } | null;
};

export const CreateInvitesDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "CreateInvites" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "objects" },
          },
          type: {
            kind: "NonNullType",
            type: {
              kind: "ListType",
              type: {
                kind: "NonNullType",
                type: {
                  kind: "NamedType",
                  name: { kind: "Name", value: "invite_insert_input" },
                },
              },
            },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            alias: { kind: "Name", value: "invites" },
            name: { kind: "Name", value: "insert_invite" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "objects" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "objects" },
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "Field",
                  name: { kind: "Name", value: "returning" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "email" } },
                    ],
                  },
                },
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
    CreateInvites(
      variables: CreateInvitesMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders
    ): Promise<CreateInvitesMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CreateInvitesMutation>(
            CreateInvitesDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders }
          ),
        "CreateInvites",
        "mutation"
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
