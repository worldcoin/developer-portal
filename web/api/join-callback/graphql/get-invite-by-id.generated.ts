/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetInviteByIdQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type GetInviteByIdQuery = {
  __typename?: "query_root";
  invite?: {
    __typename?: "invite";
    id: string;
    expires_at: string;
    email: string;
    team: { __typename?: "team"; id: string; name?: string | null };
  } | null;
};

export const GetInviteByIdDocument = gql`
  query GetInviteById($id: String!) {
    invite: invite_by_pk(id: $id) {
      id
      expires_at
      email
      team {
        id
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
    GetInviteById(
      variables: GetInviteByIdQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetInviteByIdQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetInviteByIdQuery>(GetInviteByIdDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "GetInviteById",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
