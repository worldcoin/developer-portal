/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetIsUserPermittedToDeleteLocalisationsQueryVariables =
  Types.Exact<{
    appMetadataId: Types.Scalars["String"]["input"];
    locale: Types.Scalars["String"]["input"];
    userId: Types.Scalars["String"]["input"];
  }>;

export type GetIsUserPermittedToDeleteLocalisationsQuery = {
  __typename?: "query_root";
  app_metadata: Array<{ __typename?: "app_metadata"; id: string }>;
};

export const GetIsUserPermittedToDeleteLocalisationsDocument = gql`
  query GetIsUserPermittedToDeleteLocalisations(
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
    GetIsUserPermittedToDeleteLocalisations(
      variables: GetIsUserPermittedToDeleteLocalisationsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetIsUserPermittedToDeleteLocalisationsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetIsUserPermittedToDeleteLocalisationsQuery>(
            GetIsUserPermittedToDeleteLocalisationsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetIsUserPermittedToDeleteLocalisations",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
