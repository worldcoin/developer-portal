/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetIsUserPermittedToDeleteLocalizationsQueryVariables =
  Types.Exact<{
    appMetadataId: Types.Scalars["String"]["input"];
    locale: Types.Scalars["String"]["input"];
    userId: Types.Scalars["String"]["input"];
  }>;

export type GetIsUserPermittedToDeleteLocalizationsQuery = {
  __typename?: "query_root";
  app_metadata: Array<{ __typename?: "app_metadata"; id: string }>;
};

export const GetIsUserPermittedToDeleteLocalizationsDocument = gql`
  query GetIsUserPermittedToDeleteLocalizations(
    $appMetadataId: String!
    $locale: String!
    $userId: String!
  ) {
    app_metadata(
      where: {
        _and: [
          { verification_status: { _neq: "verified" } }
          {
            app: {
              app_metadata: {
                localisations: {
                  _and: [
                    { app_metadata_id: { _eq: $appMetadataId } }
                    { locale: { _eq: $locale } }
                  ]
                }
              }
              team: {
                memberships: {
                  _and: [
                    { user_id: { _eq: $userId } }
                    {
                      _or: [{ role: { _eq: OWNER } }, { role: { _eq: ADMIN } }]
                    }
                  ]
                }
              }
            }
          }
        ]
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
    GetIsUserPermittedToDeleteLocalizations(
      variables: GetIsUserPermittedToDeleteLocalizationsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetIsUserPermittedToDeleteLocalizationsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetIsUserPermittedToDeleteLocalizationsQuery>(
            GetIsUserPermittedToDeleteLocalizationsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetIsUserPermittedToDeleteLocalizations",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
