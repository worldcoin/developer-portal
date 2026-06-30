/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type GetSingleActionQueryVariables = Types.Exact<{
  action_id: Types.Scalars["String"]["input"];
}>;

export type GetSingleActionQuery = {
  __typename?: "query_root";
  action: Array<{
    __typename?: "action";
    id: string;
    app_id: string;
    action: string;
    description: string;
    name: string;
    max_verifications: number;
    app_flow_on_complete?: unknown | null;
    webhook_uri?: string | null;
    webhook_pem?: string | null;
    post_action_deep_link_ios?: string | null;
    post_action_deep_link_android?: string | null;
    app: {
      __typename?: "app";
      id: string;
      is_staging: boolean;
      engine: string;
      app_metadata: Array<{ __typename?: "app_metadata"; app_mode: string }>;
      rp_registration: Array<{ __typename?: "rp_registration"; rp_id: string }>;
    };
  }>;
};

export const GetSingleActionDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "GetSingleAction" },
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
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "action" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "order_by" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "created_at" },
                      value: { kind: "EnumValue", value: "asc" },
                    },
                  ],
                },
              },
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
                              name: { kind: "Name", value: "action_id" },
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
                { kind: "Field", name: { kind: "Name", value: "app_id" } },
                { kind: "Field", name: { kind: "Name", value: "action" } },
                { kind: "Field", name: { kind: "Name", value: "description" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "max_verifications" },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "app_flow_on_complete" },
                },
                { kind: "Field", name: { kind: "Name", value: "webhook_uri" } },
                { kind: "Field", name: { kind: "Name", value: "webhook_pem" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "post_action_deep_link_ios" },
                },
                {
                  kind: "Field",
                  name: {
                    kind: "Name",
                    value: "post_action_deep_link_android",
                  },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "app" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "is_staging" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "engine" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "app_metadata" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "app_mode" },
                            },
                          ],
                        },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "rp_registration" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "rp_id" },
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
      },
    },
  ],
} as unknown as DocumentNode<
  GetSingleActionQuery,
  GetSingleActionQueryVariables
>;
