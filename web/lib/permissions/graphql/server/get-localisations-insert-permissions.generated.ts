/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetIsUserPermittedToInsertLocalisationsQueryVariables =
  Types.Exact<{
    appId: Types.Scalars["String"]["input"];
    userId: Types.Scalars["String"]["input"];
  }>;

export type GetIsUserPermittedToInsertLocalisationsQuery = {
  __typename?: "query_root";
  app_metadata: Array<{ __typename?: "app_metadata"; id: string }>;
};

export const GetIsUserPermittedToInsertLocalisationsDocument = gql`
  query GetIsUserPermittedToInsertLocalisations(
    $appId: String!
    $userId: String!
  ) {
    app_metadata(
      where: {
        _and: [
          { verification_status: { _eq: "unverified" } }
          {
            app: {
              id: { _eq: $appId }
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
    GetIsUserPermittedToInsertLocalisations(
      variables: GetIsUserPermittedToInsertLocalisationsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetIsUserPermittedToInsertLocalisationsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetIsUserPermittedToInsertLocalisationsQuery>(
            GetIsUserPermittedToInsertLocalisationsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetIsUserPermittedToInsertLocalisations",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
