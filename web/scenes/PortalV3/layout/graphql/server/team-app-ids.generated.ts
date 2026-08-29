/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type TeamAppIdsQueryVariables = Types.Exact<{
  teamIds:
    | Array<Types.Scalars["String"]["input"]>
    | Types.Scalars["String"]["input"];
}>;

export type TeamAppIdsQuery = {
  __typename?: "query_root";
  app: Array<{ __typename?: "app"; id: string }>;
};

export const TeamAppIdsDocument = gql`
  query TeamAppIds($teamIds: [String!]!) {
    app(
      where: { team: { id: { _in: $teamIds } }, deleted_at: { _is_null: true } }
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
    TeamAppIds(
      variables: TeamAppIdsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<TeamAppIdsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<TeamAppIdsQuery>(TeamAppIdsDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "TeamAppIds",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
