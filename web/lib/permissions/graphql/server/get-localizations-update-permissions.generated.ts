/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetIsUserPermittedToModifyLocalizationsQueryVariables =
  Types.Exact<{
    localizationId: Types.Scalars["String"]["input"];
    userId: Types.Scalars["String"]["input"];
  }>;

export type GetIsUserPermittedToModifyLocalizationsQuery = {
  __typename?: "query_root";
  app_metadata: Array<{ __typename?: "app_metadata"; id: string }>;
};

export const GetIsUserPermittedToModifyLocalizationsDocument = gql`
  query GetIsUserPermittedToModifyLocalizations(
    $localizationId: String!
    $userId: String!
  ) {
    app_metadata(
      where: {
        _and: [
          { verification_status: { _neq: "verified" } }
          {
            app: {
              app_metadata: { localisations: { id: { _eq: $localizationId } } }
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
    GetIsUserPermittedToModifyLocalizations(
      variables: GetIsUserPermittedToModifyLocalizationsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetIsUserPermittedToModifyLocalizationsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetIsUserPermittedToModifyLocalizationsQuery>(
            GetIsUserPermittedToModifyLocalizationsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetIsUserPermittedToModifyLocalizations",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
