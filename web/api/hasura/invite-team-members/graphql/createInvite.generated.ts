/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type CreateInvitesMutationVariables = Types.Exact<{
  objects: Array<Types.Invite_Insert_Input> | Types.Invite_Insert_Input;
}>;

export type CreateInvitesMutation = {
  __typename?: "mutation_root";
  invites?: {
    __typename?: "invite_mutation_response";
    returning: Array<{ __typename?: "invite"; id: string; email: string }>;
  } | null;
};

export const CreateInvitesDocument = gql`
  mutation CreateInvites($objects: [invite_insert_input!]!) {
    invites: insert_invite(objects: $objects) {
      returning {
        id
        email
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
    CreateInvites(
      variables: CreateInvitesMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<CreateInvitesMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CreateInvitesMutation>(
            CreateInvitesDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "CreateInvites",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
