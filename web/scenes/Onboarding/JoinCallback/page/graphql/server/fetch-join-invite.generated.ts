/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchJoinInviteQueryVariables = Types.Exact<{
  invite_id: Types.Scalars["String"]["input"];
}>;

export type FetchJoinInviteQuery = {
  __typename?: "query_root";
  invite_by_pk?: {
    __typename?: "invite";
    id: string;
    expires_at: string;
    team: { __typename?: "team"; name?: string | null };
  } | null;
};

export const FetchJoinInviteDocument = gql`
  query FetchJoinInvite($invite_id: String!) {
    invite_by_pk(id: $invite_id) {
      id
      expires_at
      team {
        name
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
    FetchJoinInvite(
      variables: FetchJoinInviteQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchJoinInviteQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchJoinInviteQuery>(
            FetchJoinInviteDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchJoinInvite",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
