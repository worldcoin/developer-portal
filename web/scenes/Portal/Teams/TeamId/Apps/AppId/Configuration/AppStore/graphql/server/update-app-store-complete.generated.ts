/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateAppStoreCompleteMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  app_metadata_input: Types.App_Metadata_Set_Input;
  localisations_to_upsert:
    | Array<Types.Localisations_Insert_Input>
    | Types.Localisations_Insert_Input;
}>;

export type UpdateAppStoreCompleteMutation = {
  __typename?: "mutation_root";
  update_app_metadata?: {
    __typename?: "app_metadata_mutation_response";
    affected_rows: number;
  } | null;
  insert_localisations?: {
    __typename?: "localisations_mutation_response";
    affected_rows: number;
  } | null;
};

export const UpdateAppStoreCompleteDocument = gql`
  mutation UpdateAppStoreComplete(
    $app_metadata_id: String!
    $app_metadata_input: app_metadata_set_input!
    $localisations_to_upsert: [localisations_insert_input!]!
  ) {
    update_app_metadata(
      where: {
        _and: [
          { id: { _eq: $app_metadata_id } }
          { verification_status: { _eq: "unverified" } }
        ]
      }
      _set: $app_metadata_input
    ) {
      affected_rows
    }
    insert_localisations(
      objects: $localisations_to_upsert
      on_conflict: {
        constraint: unique_app_metadata_locale
        update_columns: [
          name
          short_name
          world_app_description
          description
          world_app_button_text
          meta_tag_image_url
          showcase_img_urls
          hero_image_url
        ]
      }
    ) {
      affected_rows
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
    UpdateAppStoreComplete(
      variables: UpdateAppStoreCompleteMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateAppStoreCompleteMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateAppStoreCompleteMutation>(
            UpdateAppStoreCompleteDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "UpdateAppStoreComplete",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
