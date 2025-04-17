/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchLocalisationQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
  locale: Types.Scalars["String"]["input"];
}>;

export type FetchLocalisationQuery = {
  __typename?: "query_root";
  localisations: Array<{ __typename?: "localisations"; id: string }>;
};

export const FetchLocalisationDocument = gql`
  query FetchLocalisation($id: String!, $locale: String!) {
    localisations(
      where: { app_metadata_id: { _eq: $id }, locale: { _eq: $locale } }
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
    FetchLocalisation(
      variables: FetchLocalisationQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchLocalisationQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchLocalisationQuery>(
            FetchLocalisationDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchLocalisation",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
