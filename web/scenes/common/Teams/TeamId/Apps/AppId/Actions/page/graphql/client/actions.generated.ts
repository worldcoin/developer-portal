/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type GetActionsQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  condition?: Types.InputMaybe<
    Array<Types.Action_Bool_Exp> | Types.Action_Bool_Exp
  >;
}>;

export type GetActionsQuery = {
  __typename?: "query_root";
  actions: Array<{
    __typename?: "action";
    id: string;
    app_id: string;
    action: string;
    created_at: string;
    creation_mode: string;
    description: string;
    external_nullifier: string;
    kiosk_enabled: boolean;
    name: string;
    max_accounts_per_user: number;
    max_verifications: number;
    app_flow_on_complete?: unknown | null;
    webhook_uri?: string | null;
    webhook_pem?: string | null;
    post_action_deep_link_ios?: string | null;
    post_action_deep_link_android?: string | null;
    updated_at: string;
    nullifiers: {
      __typename?: "nullifier_aggregate";
      aggregate?: {
        __typename?: "nullifier_aggregate_fields";
        sum?: {
          __typename?: "nullifier_sum_fields";
          uses?: number | null;
        } | null;
      } | null;
    };
  }>;
};

export const GetActionsDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "GetActions" },
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
            name: { kind: "Name", value: "condition" },
          },
          type: {
            kind: "ListType",
            type: {
              kind: "NonNullType",
              type: {
                kind: "NamedType",
                name: { kind: "Name", value: "action_bool_exp" },
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
            alias: { kind: "Name", value: "actions" },
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
                      name: { kind: "Name", value: "app_id" },
                      value: {
                        kind: "ObjectValue",
                        fields: [
                          {
                            kind: "ObjectField",
                            name: { kind: "Name", value: "_eq" },
                            value: {
                              kind: "Variable",
                              name: { kind: "Name", value: "app_id" },
                            },
                          },
                        ],
                      },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "action" },
                      value: {
                        kind: "ObjectValue",
                        fields: [
                          {
                            kind: "ObjectField",
                            name: { kind: "Name", value: "_neq" },
                            value: {
                              kind: "StringValue",
                              value: "",
                              block: false,
                            },
                          },
                        ],
                      },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "_or" },
                      value: {
                        kind: "Variable",
                        name: { kind: "Name", value: "condition" },
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
                { kind: "Field", name: { kind: "Name", value: "created_at" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "creation_mode" },
                },
                { kind: "Field", name: { kind: "Name", value: "description" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "external_nullifier" },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "kiosk_enabled" },
                },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "max_accounts_per_user" },
                },
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
                { kind: "Field", name: { kind: "Name", value: "updated_at" } },
                {
                  kind: "Field",
                  alias: { kind: "Name", value: "nullifiers" },
                  name: { kind: "Name", value: "nullifiers_aggregate" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "aggregate" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "sum" },
                              selectionSet: {
                                kind: "SelectionSet",
                                selections: [
                                  {
                                    kind: "Field",
                                    name: { kind: "Name", value: "uses" },
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
      },
    },
  ],
} as unknown as DocumentNode<GetActionsQuery, GetActionsQueryVariables>;
