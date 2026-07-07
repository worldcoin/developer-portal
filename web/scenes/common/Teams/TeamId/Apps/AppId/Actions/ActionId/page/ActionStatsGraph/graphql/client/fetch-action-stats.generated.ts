/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type FetchActionStatsQueryVariables = Types.Exact<{
  actionId: Types.Scalars["String"]["input"];
  startsAt: Types.Scalars["timestamptz"]["input"];
  timeSpan: Types.Scalars["String"]["input"];
}>;

export type FetchActionStatsQuery = {
  __typename?: "query_root";
  action_stats: Array<{
    __typename?: "action_stats_returning";
    action_id: string;
    date: string;
    verifications: string;
    unique_users: string;
  }>;
};

export const FetchActionStatsDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "FetchActionStats" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "actionId" },
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
            name: { kind: "Name", value: "startsAt" },
          },
          type: {
            kind: "NonNullType",
            type: {
              kind: "NamedType",
              name: { kind: "Name", value: "timestamptz" },
            },
          },
        },
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "timeSpan" },
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
            name: { kind: "Name", value: "action_stats" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "args" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "actionId" },
                      value: {
                        kind: "Variable",
                        name: { kind: "Name", value: "actionId" },
                      },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "startsAt" },
                      value: {
                        kind: "Variable",
                        name: { kind: "Name", value: "startsAt" },
                      },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "timespan" },
                      value: {
                        kind: "Variable",
                        name: { kind: "Name", value: "timeSpan" },
                      },
                    },
                  ],
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "action_id" } },
                { kind: "Field", name: { kind: "Name", value: "date" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "verifications" },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "unique_users" },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  FetchActionStatsQuery,
  FetchActionStatsQueryVariables
>;
