/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import * as Dom from "graphql-request/dist/types.dom";
import gql from "graphql-tag";
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
    CreateInvites(
      variables: CreateInvitesMutationVariables,
      requestHeaders?: Dom.RequestInit["headers"]
    ): Promise<CreateInvitesMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CreateInvitesMutation>(
            CreateInvitesDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders }
          ),
        "CreateInvites",
        "mutation"
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
