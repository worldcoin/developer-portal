/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type GetVerificationDataQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type GetVerificationDataQuery = {
  __typename?: "query_root";
  app?: {
    __typename?: "app";
    id: string;
    app_metadata: Array<{
      __typename?: "app_metadata";
      id: string;
      review_message: string;
      verification_status: string;
    }>;
  } | null;
};

export const GetVerificationDataDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "GetVerificationData" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "id" } },
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
            alias: { kind: "Name", value: "app" },
            name: { kind: "Name", value: "app_by_pk" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "id" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "id" },
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "app_metadata" },
                  arguments: [
                    {
                      kind: "Argument",
                      name: { kind: "Name", value: "where" },
                      value: {
                        kind: "ObjectValue",
                        fields: [
                          {
                            kind: "ObjectField",
                            name: { kind: "Name", value: "_or" },
                            value: {
                              kind: "ListValue",
                              values: [
                                {
                                  kind: "ObjectValue",
                                  fields: [
                                    {
                                      kind: "ObjectField",
                                      name: {
                                        kind: "Name",
                                        value: "verification_status",
                                      },
                                      value: {
                                        kind: "ObjectValue",
                                        fields: [
                                          {
                                            kind: "ObjectField",
                                            name: {
                                              kind: "Name",
                                              value: "_eq",
                                            },
                                            value: {
                                              kind: "StringValue",
                                              value: "changes_requested",
                                              block: false,
                                            },
                                          },
                                        ],
                                      },
                                    },
                                  ],
                                },
                                {
                                  kind: "ObjectValue",
                                  fields: [
                                    {
                                      kind: "ObjectField",
                                      name: {
                                        kind: "Name",
                                        value: "verification_status",
                                      },
                                      value: {
                                        kind: "ObjectValue",
                                        fields: [
                                          {
                                            kind: "ObjectField",
                                            name: {
                                              kind: "Name",
                                              value: "_eq",
                                            },
                                            value: {
                                              kind: "StringValue",
                                              value: "verified",
                                              block: false,
                                            },
                                          },
                                        ],
                                      },
                                    },
                                  ],
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
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "review_message" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "verification_status" },
                      },
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
} as unknown as DocumentNode<
  GetVerificationDataQuery,
  GetVerificationDataQueryVariables
>;
