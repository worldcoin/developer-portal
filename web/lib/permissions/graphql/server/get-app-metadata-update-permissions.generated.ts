/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetIsUserPermittedToModifyAppMetadataQueryVariables = Types.Exact<{
  appMetadataId: Types.Scalars["String"]["input"];
  userId: Types.Scalars["String"]["input"];
}>;

export type GetIsUserPermittedToModifyAppMetadataQuery = {
  __typename?: "query_root";
  app_metadata: Array<{
    __typename?: "app_metadata";
    app: {
      __typename?: "app";
      team: {
        __typename?: "team";
        memberships: Array<{
          __typename?: "membership";
          user_id: string;
          role: Types.Role_Enum;
        }>;
      };
    };
  }>;
};

export const GetIsUserPermittedToModifyAppMetadataDocument = gql`
  query GetIsUserPermittedToModifyAppMetadata(
    $appMetadataId: String!
    $userId: String!
  ) {
    app_metadata(
      where: {
        id: { _eq: $appMetadataId }
        verification_status: { _eq: "unverified" }
      }
    ) {
      app {
        team {
          memberships(
            where: {
              _or: [
                { user_id: { _eq: $userId }, role: { _eq: OWNER } }
                { user_id: { _eq: $userId }, role: { _eq: ADMIN } }
              ]
            }
          ) {
            user_id
            role
          }
        }
      }
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
    GetIsUserPermittedToModifyAppMetadata(
      variables: GetIsUserPermittedToModifyAppMetadataQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetIsUserPermittedToModifyAppMetadataQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetIsUserPermittedToModifyAppMetadataQuery>(
            GetIsUserPermittedToModifyAppMetadataDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetIsUserPermittedToModifyAppMetadata",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
