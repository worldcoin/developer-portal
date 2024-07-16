/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type GetLocalisationsQueryVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"];
}>;

export type GetLocalisationsQuery = {
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

export const GetLocalisationsDocument = gql`
  query GetLocalisations($app_metadata_id: String!) {
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
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType,
) => action();

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper,
) {
  return {
    GetLocalisations(
      variables: GetLocalisationsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetLocalisationsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetLocalisationsQuery>(
            GetLocalisationsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetLocalisations",
        "query",
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
