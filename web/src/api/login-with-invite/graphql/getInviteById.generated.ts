/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import * as Dom from "graphql-request/dist/types.dom";
import gql from "graphql-tag";
export type GetInviteByIdQueryVariables = Types.Exact<{
  id: Types.Scalars["String"];
}>;

export type GetInviteByIdQuery = {
  __typename?: "query_root";
  invite?: {
    __typename?: "invite";
    team_id: string;
    id: string;
    expires_at: any;
    email: string;
  } | null;
};

export const GetInviteByIdDocument = gql`
  query GetInviteById($id: String!) {
    invite: invite_by_pk(id: $id) {
      team_id
      id
      expires_at
      email
    }
  }
`;

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType
) => action();

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper
) {
  return {
    GetInviteById(
      variables: GetInviteByIdQueryVariables,
      requestHeaders?: Dom.RequestInit["headers"]
    ): Promise<GetInviteByIdQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetInviteByIdQuery>(GetInviteByIdDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "GetInviteById",
        "query"
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
