/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import { DocumentNode } from "graphql";
export type FindUserByNullifierQueryVariables = Types.Exact<{
  nullifier: Types.Scalars["String"];
}>;

export type FindUserByNullifierQuery = {
  __typename?: "query_root";
  users: Array<{ __typename?: "user"; id: string; team_id: string }>;
};

export const FindUserByNullifierDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "FindUserByNullifier" },
      variableDefinitions: [
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
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            alias: { kind: "Name", value: "users" },
            name: { kind: "Name", value: "user" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "where" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "world_id_nullifier" },
                      value: {
                        kind: "ObjectValue",
                        fields: [
                          {
                            kind: "ObjectField",
                            name: { kind: "Name", value: "_eq" },
                            value: {
                              kind: "Variable",
                              name: { kind: "Name", value: "nullifier" },
                            },
                          },
                        ],
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
    FindUserByNullifier(
      variables: FindUserByNullifierQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders
    ): Promise<FindUserByNullifierQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FindUserByNullifierQuery>(
            FindUserByNullifierDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders }
          ),
        "FindUserByNullifier",
        "query"
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
