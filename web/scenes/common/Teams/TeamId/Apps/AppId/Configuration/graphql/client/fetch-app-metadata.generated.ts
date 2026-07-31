/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type FetchAppMetadataQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type FetchAppMetadataQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    id: string;
    engine: string;
    is_staging: boolean;
    status: string;
    team: { __typename?: "team"; name?: string | null };
    app_metadata: Array<{
      __typename?: "app_metadata";
      id: string;
      app_id: string;
      name: string;
      logo_img_url: string;
      hero_image_url: string;
      meta_tag_image_url: string;
      showcase_img_urls?: Array<string> | null;
      description: string;
      world_app_description: string;
      category: string;
      is_developer_allow_listing: boolean;
      world_app_button_text: string;
      integration_url: string;
      app_website_url: string;
      source_code_url: string;
      verified_at?: string | null;
      review_message: string;
      verification_status: string;
      app_mode: string;
      whitelisted_addresses?: Array<string> | null;
      support_link: string;
      supported_countries?: Array<string> | null;
      supported_languages?: Array<string> | null;
      short_name: string;
      associated_domains?: Array<string> | null;
      contracts?: Array<string> | null;
      permit2_tokens?: Array<string> | null;
      can_import_all_contacts: boolean;
      can_use_attestation: boolean;
      is_allowed_unlimited_notifications?: boolean | null;
      max_notifications_per_day?: number | null;
      is_android_only: boolean;
      is_for_humans_only: boolean;
      content_card_image_url: string;
    }>;
    verified_app_metadata: Array<{
      __typename?: "app_metadata";
      id: string;
      app_id: string;
      name: string;
      logo_img_url: string;
      hero_image_url: string;
      meta_tag_image_url: string;
      showcase_img_urls?: Array<string> | null;
      description: string;
      world_app_description: string;
      category: string;
      is_developer_allow_listing: boolean;
      world_app_button_text: string;
      integration_url: string;
      app_website_url: string;
      source_code_url: string;
      verified_at?: string | null;
      review_message: string;
      verification_status: string;
      app_mode: string;
      whitelisted_addresses?: Array<string> | null;
      support_link: string;
      supported_countries?: Array<string> | null;
      supported_languages?: Array<string> | null;
      short_name: string;
      associated_domains?: Array<string> | null;
      contracts?: Array<string> | null;
      permit2_tokens?: Array<string> | null;
      can_import_all_contacts: boolean;
      can_use_attestation: boolean;
      is_allowed_unlimited_notifications?: boolean | null;
      max_notifications_per_day?: number | null;
      is_android_only: boolean;
      is_for_humans_only: boolean;
      content_card_image_url: string;
    }>;
  }>;
};

export const FetchAppMetadataDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "FetchAppMetadata" },
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
                { kind: "Field", name: { kind: "Name", value: "engine" } },
                { kind: "Field", name: { kind: "Name", value: "is_staging" } },
                { kind: "Field", name: { kind: "Name", value: "status" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "team" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "name" } },
                    ],
                  },
                },
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
                        name: { kind: "Name", value: "app_id" },
                      },
                      { kind: "Field", name: { kind: "Name", value: "name" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "logo_img_url" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "hero_image_url" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "meta_tag_image_url" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "showcase_img_urls" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "description" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "world_app_description" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "category" },
                      },
                      {
                        kind: "Field",
                        name: {
                          kind: "Name",
                          value: "is_developer_allow_listing",
                        },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "world_app_button_text" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "integration_url" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "app_website_url" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "source_code_url" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "verified_at" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "review_message" },
                      },
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
                        name: { kind: "Name", value: "whitelisted_addresses" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "support_link" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "supported_countries" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "supported_languages" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "short_name" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "associated_domains" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "contracts" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "permit2_tokens" },
                      },
                      {
                        kind: "Field",
                        name: {
                          kind: "Name",
                          value: "can_import_all_contacts",
                        },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "can_use_attestation" },
                      },
                      {
                        kind: "Field",
                        name: {
                          kind: "Name",
                          value: "is_allowed_unlimited_notifications",
                        },
                      },
                      {
                        kind: "Field",
                        name: {
                          kind: "Name",
                          value: "max_notifications_per_day",
                        },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "is_android_only" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "is_for_humans_only" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "content_card_image_url" },
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
                        name: { kind: "Name", value: "app_id" },
                      },
                      { kind: "Field", name: { kind: "Name", value: "name" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "logo_img_url" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "hero_image_url" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "meta_tag_image_url" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "showcase_img_urls" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "description" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "world_app_description" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "category" },
                      },
                      {
                        kind: "Field",
                        name: {
                          kind: "Name",
                          value: "is_developer_allow_listing",
                        },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "world_app_button_text" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "integration_url" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "app_website_url" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "source_code_url" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "verified_at" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "review_message" },
                      },
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
                        name: { kind: "Name", value: "whitelisted_addresses" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "support_link" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "supported_countries" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "supported_languages" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "short_name" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "associated_domains" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "contracts" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "permit2_tokens" },
                      },
                      {
                        kind: "Field",
                        name: {
                          kind: "Name",
                          value: "can_import_all_contacts",
                        },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "can_use_attestation" },
                      },
                      {
                        kind: "Field",
                        name: {
                          kind: "Name",
                          value: "is_allowed_unlimited_notifications",
                        },
                      },
                      {
                        kind: "Field",
                        name: {
                          kind: "Name",
                          value: "max_notifications_per_day",
                        },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "is_android_only" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "is_for_humans_only" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "content_card_image_url" },
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
  FetchAppMetadataQuery,
  FetchAppMetadataQueryVariables
>;
