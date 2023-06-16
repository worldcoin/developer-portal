/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import * as Dom from "graphql-request/dist/types.dom";
import gql from "graphql-tag";
export type CreateUserAndDeleteInviteMutationVariables = Types.Exact<{
  email: Types.Scalars["String"];
  team_id: Types.Scalars["String"];
  nullifier: Types.Scalars["String"];
  ironclad_id: Types.Scalars["String"];
  invite_id: Types.Scalars["String"];
}>;

export type CreateUserAndDeleteInviteMutation = {
  __typename?: "mutation_root";
  user?: { __typename?: "user"; id: string } | null;
  delete_invite_by_pk?: { __typename?: "invite"; id: string } | null;
};

export const CreateUserAndDeleteInviteDocument = gql`
  mutation CreateUserAndDeleteInvite(
    $email: String!
    $team_id: String!
    $nullifier: String!
    $ironclad_id: String!
    $invite_id: String!
  ) {
    user: insert_user_one(
      object: {
        email: $email
        team_id: $team_id
        world_id_nullifier: $nullifier
        ironclad_id: $ironclad_id
      }
    ) {
      id
    }
    delete_invite_by_pk(id: $invite_id) {
      id
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
    CreateUserAndDeleteInvite(
      variables: CreateUserAndDeleteInviteMutationVariables,
      requestHeaders?: Dom.RequestInit["headers"]
    ): Promise<CreateUserAndDeleteInviteMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CreateUserAndDeleteInviteMutation>(
            CreateUserAndDeleteInviteDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders }
          ),
        "CreateUserAndDeleteInvite",
        "mutation"
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
