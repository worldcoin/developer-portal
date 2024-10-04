/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type DeleteInviteMutationVariables = Types.Exact<{
  invite_id: Types.Scalars["String"]["input"];
}>;

export type DeleteInviteMutation = {
  __typename?: "mutation_root";
  delete_invite_by_pk?: { __typename?: "invite"; id: string } | null;
};

export const DeleteInviteDocument = gql`
  mutation DeleteInvite($invite_id: String!) {
    delete_invite_by_pk(id: $invite_id) {
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
    DeleteInvite(
      variables: DeleteInviteMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<DeleteInviteMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<DeleteInviteMutation>(
            DeleteInviteDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "DeleteInvite",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
