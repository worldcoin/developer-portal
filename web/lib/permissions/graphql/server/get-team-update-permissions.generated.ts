/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetIsUserPermittedToModifyTeamQueryVariables = Types.Exact<{
  teamId: Types.Scalars["String"]["input"];
  userId: Types.Scalars["String"]["input"];
}>;

export type GetIsUserPermittedToModifyTeamQuery = {
  __typename?: "query_root";
  team: Array<{ __typename?: "team"; id: string }>;
};

export const GetIsUserPermittedToModifyTeamDocument = gql`
  query GetIsUserPermittedToModifyTeam($teamId: String!, $userId: String!) {
    team(
      where: {
        _and: [
          { id: { _eq: $teamId } }
          {
            memberships: {
              _and: [
                { user_id: { _eq: $userId } }
                { _or: [{ role: { _eq: OWNER } }, { role: { _eq: ADMIN } }] }
              ]
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
    GetIsUserPermittedToModifyTeam(
      variables: GetIsUserPermittedToModifyTeamQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetIsUserPermittedToModifyTeamQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetIsUserPermittedToModifyTeamQuery>(
            GetIsUserPermittedToModifyTeamDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetIsUserPermittedToModifyTeam",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
