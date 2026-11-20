/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type CreateTeamInviteMutationVariables = Types.Exact<{
  object: Types.Invite_Insert_Input;
}>;

export type CreateTeamInviteMutation = {
  __typename?: "mutation_root";
  insert_invite_one?: {
    __typename?: "invite";
    id: string;
    email: string;
    role: Types.Role_Enum;
  } | null;
};

export const CreateTeamInviteDocument = gql`
  mutation CreateTeamInvite($object: invite_insert_input!) {
    insert_invite_one(object: $object) {
      id
      email
      role
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
    CreateTeamInvite(
      variables: CreateTeamInviteMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<CreateTeamInviteMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CreateTeamInviteMutation>(
            CreateTeamInviteDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "CreateTeamInvite",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
