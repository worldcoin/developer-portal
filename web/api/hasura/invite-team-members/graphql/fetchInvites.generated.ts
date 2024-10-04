/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchInvitesQueryVariables = Types.Exact<{
  emails:
    | Array<Types.Scalars["String"]["input"]>
    | Types.Scalars["String"]["input"];
}>;

export type FetchInvitesQuery = {
  __typename?: "query_root";
  invite: Array<{
    __typename?: "invite";
    id: string;
    email: string;
    team_id: string;
  }>;
};

export const FetchInvitesDocument = gql`
  query FetchInvites($emails: [String!]!) {
    invite(where: { email: { _in: $emails } }) {
      id
      email
      team_id
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
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
