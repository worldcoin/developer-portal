/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type FetchLocalisationsQueryVariables = Types.Exact<{
  id: Types.Scalars["String"];
}>;

export type FetchLocalisationsQuery = {
  __typename?: "query_root";
  localisations: Array<{
    __typename?: "localisations";
    id: string;
    app_metadata_id: string;
    locale: string;
    name: string;
    description: string;
    world_app_button_text: string;
    world_app_description: string;
    short_name: string;
  }>;
};

export const FetchLocalisationsDocument = gql`
  query FetchLocalisations($id: String!) {
    localisations(where: { app_metadata_id: { _eq: $id } }) {
      id
      app_metadata_id
      locale
      name
      description
      world_app_button_text
      world_app_description
      short_name
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
    FetchLocalisations(
      variables: FetchLocalisationsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchLocalisationsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchLocalisationsQuery>(
            FetchLocalisationsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchLocalisations",
        "query",
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
