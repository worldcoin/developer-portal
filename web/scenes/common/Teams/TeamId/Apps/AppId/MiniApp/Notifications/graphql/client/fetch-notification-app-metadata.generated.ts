/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type FetchNotificationAppMetadataQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type FetchNotificationAppMetadataQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    id: string;
    app_metadata: Array<{
      __typename?: "app_metadata";
      id: string;
      verification_status: string;
      app_mode: string;
      category: string;
    }>;
    verified_app_metadata: Array<{
      __typename?: "app_metadata";
      id: string;
      verified_at?: string | null;
      app_mode: string;
      category: string;
    }>;
  }>;
};

export const FetchNotificationAppMetadataDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "FetchNotificationAppMetadata" },
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
            name: { kind: "Name", value: "app" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "where" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "id" },
                      value: {
                        kind: "ObjectValue",
                        fields: [
                          {
                            kind: "ObjectField",
                            name: { kind: "Name", value: "_eq" },
                            value: {
                              kind: "Variable",
                              name: { kind: "Name", value: "id" },
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
                            name: {
                              kind: "Name",
                              value: "verification_status",
                            },
                            value: {
                              kind: "ObjectValue",
                              fields: [
                                {
                                  kind: "ObjectField",
                                  name: { kind: "Name", value: "_neq" },
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
                    },
                  ],
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "verification_status" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "app_mode" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "category" },
                      },
                    ],
                  },
                },
                {
                  kind: "Field",
                  alias: { kind: "Name", value: "verified_app_metadata" },
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
                            name: {
                              kind: "Name",
                              value: "verification_status",
                            },
                            value: {
                              kind: "ObjectValue",
                              fields: [
                                {
                                  kind: "ObjectField",
                                  name: { kind: "Name", value: "_eq" },
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
                    },
                  ],
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "verified_at" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "app_mode" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "category" },
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
  FetchNotificationAppMetadataQuery,
  FetchNotificationAppMetadataQueryVariables
>;
