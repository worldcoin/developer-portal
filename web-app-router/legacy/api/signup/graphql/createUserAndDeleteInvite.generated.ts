/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from '@/graphql/graphql';

import { GraphQLClient } from 'graphql-request';
import { GraphQLClientRequestHeaders } from 'graphql-request/build/cjs/types';
import gql from 'graphql-tag';
export type CreateUserAndDeleteInviteMutationVariables = Types.Exact<{
  team_id: Types.Scalars['String'];
  nullifier: Types.Scalars['String'];
  ironclad_id: Types.Scalars['String'];
  invite_id: Types.Scalars['String'];
  auth0Id: Types.Scalars['String'];
  name?: Types.InputMaybe<Types.Scalars['String']>;
  email?: Types.InputMaybe<Types.Scalars['String']>;
}>;


export type CreateUserAndDeleteInviteMutation = { __typename?: 'mutation_root', user?: { __typename?: 'user', id: string, team_id: string, ironclad_id: string, posthog_id?: string | null, world_id_nullifier?: string | null, auth0Id?: string | null, name: string, email?: string | null } | null, delete_invite_by_pk?: { __typename?: 'invite', id: string } | null };


export const CreateUserAndDeleteInviteDocument = gql`
    mutation CreateUserAndDeleteInvite($team_id: String!, $nullifier: String!, $ironclad_id: String!, $invite_id: String!, $auth0Id: String!, $name: String, $email: String) {
  user: insert_user_one(
    object: {team_id: $team_id, world_id_nullifier: $nullifier, ironclad_id: $ironclad_id, auth0Id: $auth0Id, name: $name, email: $email}
  ) {
    id
    team_id
    ironclad_id
    posthog_id
    world_id_nullifier
    auth0Id
    name
    email
  }
  delete_invite_by_pk(id: $invite_id) {
    id
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    CreateUserAndDeleteInvite(variables: CreateUserAndDeleteInviteMutationVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<CreateUserAndDeleteInviteMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateUserAndDeleteInviteMutation>(CreateUserAndDeleteInviteDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateUserAndDeleteInvite', 'mutation');
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;