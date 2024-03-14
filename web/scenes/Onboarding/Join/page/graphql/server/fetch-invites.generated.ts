/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type FetchInvitesQueryVariables = Types.Exact<{
  invite_id: Types.Scalars["String"];
}>;

export type FetchInvitesQuery = {
  __typename?: "query_root";
  invite_by_pk?: {
    __typename?: "invite";
    team: { __typename?: "team"; name?: string | null };
  } | null;
};

export const FetchInvitesDocument = gql`
  query FetchInvites($invite_id: String!) {
    invite_by_pk(id: $invite_id) {
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
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType,
) => action();

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper,
) {
  return {
    FetchInvites(
      variables: FetchInvitesQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchInvitesQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchInvitesQuery>(FetchInvitesDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "FetchInvites",
        "query",
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;

