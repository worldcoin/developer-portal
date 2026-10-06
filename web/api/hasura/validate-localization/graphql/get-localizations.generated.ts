/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetLocalizationsQueryVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
}>;

export type GetLocalizationsQuery = {
  __typename?: "query_root";
  localisations: Array<{
    __typename?: "localisations";
    id: string;
    locale: string;
    name: string;
    short_name: string;
    world_app_button_text: string;
    world_app_description: string;
    description: string;
  }>;
};

export const GetLocalizationsDocument = gql`
  query GetLocalizations($app_metadata_id: String!) {
    localisations(where: { app_metadata_id: { _eq: $app_metadata_id } }) {
      id
      locale
      name
      short_name
      world_app_button_text
      world_app_description
      description
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
    GetLocalizations(
      variables: GetLocalizationsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetLocalizationsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetLocalizationsQuery>(
            GetLocalizationsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetLocalizations",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
