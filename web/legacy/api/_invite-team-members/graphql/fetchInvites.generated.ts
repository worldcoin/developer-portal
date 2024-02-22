/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type FetchInvitesQueryVariables = Types.Exact<{
  emails: Array<Types.Scalars["String"]> | Types.Scalars["String"];
}>;

export type FetchInvitesQuery = {
  __typename?: "query_root";
  invite: Array<{ __typename?: "invite"; id: string; email: string }>;
};

export const FetchInvitesDocument = gql`
  query FetchInvites($emails: [String!]!) {
    invite(where: { email: { _in: $emails } }) {
      id
      email
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
