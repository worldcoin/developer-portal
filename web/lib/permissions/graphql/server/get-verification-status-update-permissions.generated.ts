/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetIsUserPermittedToUpdateVerificationStatusQueryVariables =
  Types.Exact<{
    appMetadataId: Types.Scalars["String"]["input"];
    userId: Types.Scalars["String"]["input"];
  }>;

export type GetIsUserPermittedToUpdateVerificationStatusQuery = {
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

export const GetIsUserPermittedToUpdateVerificationStatusDocument = gql`
  query GetIsUserPermittedToUpdateVerificationStatus(
    $appMetadataId: String!
    $userId: String!
  ) {
    app_metadata(
      where: {
        id: { _eq: $appMetadataId }
        verification_status: { _in: ["awaiting_review", "changes_requested"] }
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
    GetIsUserPermittedToUpdateVerificationStatus(
      variables: GetIsUserPermittedToUpdateVerificationStatusQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetIsUserPermittedToUpdateVerificationStatusQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetIsUserPermittedToUpdateVerificationStatusQuery>(
            GetIsUserPermittedToUpdateVerificationStatusDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetIsUserPermittedToUpdateVerificationStatus",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
