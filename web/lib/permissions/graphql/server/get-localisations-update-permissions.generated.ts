/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetIsUserPermittedToModifyLocalisationsQueryVariables =
  Types.Exact<{
    localisationId: Types.Scalars["String"]["input"];
    userId: Types.Scalars["String"]["input"];
  }>;

export type GetIsUserPermittedToModifyLocalisationsQuery = {
  __typename?: "query_root";
  app_metadata: Array<{ __typename?: "app_metadata"; id: string }>;
};

export const GetIsUserPermittedToModifyLocalisationsDocument = gql`
  query GetIsUserPermittedToModifyLocalisations(
    $localisationId: String!
    $userId: String!
  ) {
    app_metadata(
      where: {
        _and: [
          { verification_status: { _neq: "verified" } }
          {
            app: {
              app_metadata: { localisations: { id: { _eq: $localisationId } } }
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
    GetIsUserPermittedToModifyLocalisations(
      variables: GetIsUserPermittedToModifyLocalisationsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetIsUserPermittedToModifyLocalisationsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetIsUserPermittedToModifyLocalisationsQuery>(
            GetIsUserPermittedToModifyLocalisationsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetIsUserPermittedToModifyLocalisations",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
