/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type InsertLayoutMutationVariables = Types.Exact<{
  layoutBanners:
    | Array<Types.Layout_Banner_Insert_Input>
    | Types.Layout_Banner_Insert_Input;
  layoutApps:
    | Array<Types.Layout_App_Insert_Input>
    | Types.Layout_App_Insert_Input;
  layoutAppCollections:
    | Array<Types.Layout_App_Collection_Insert_Input>
    | Types.Layout_App_Collection_Insert_Input;
  layoutBannerCollections:
    | Array<Types.Layout_Banner_Collection_Insert_Input>
    | Types.Layout_Banner_Collection_Insert_Input;
  layoutSecondaryCategories:
    | Array<Types.Layout_Secondary_Category_Insert_Input>
    | Types.Layout_Secondary_Category_Insert_Input;
}>;

export type InsertLayoutMutation = {
  __typename?: "mutation_root";
  insert_layout_one?: { __typename?: "layout"; id: string } | null;
};

export const InsertLayoutDocument = gql`
  mutation InsertLayout(
    $layoutBanners: [layout_banner_insert_input!]!
    $layoutApps: [layout_app_insert_input!]!
    $layoutAppCollections: [layout_app_collection_insert_input!]!
    $layoutBannerCollections: [layout_banner_collection_insert_input!]!
    $layoutSecondaryCategories: [layout_secondary_category_insert_input!]!
  ) {
    insert_layout_one(
      object: {
        layout_apps: { data: $layoutApps }
        layout_banners: { data: $layoutBanners }
        layout_banner_collections: { data: $layoutBannerCollections }
        layout_app_collections: { data: $layoutAppCollections }
        layout_secondary_categories: { data: $layoutSecondaryCategories }
      }
    ) {
      id
    }
  }
`;

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string,
  variables?: any,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType,
  _variables,
) => action();

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper,
) {
  return {
    InsertLayout(
      variables: InsertLayoutMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<InsertLayoutMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<InsertLayoutMutation>(
            InsertLayoutDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "InsertLayout",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
