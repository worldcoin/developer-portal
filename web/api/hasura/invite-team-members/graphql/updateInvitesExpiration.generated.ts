/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type UpdateInvitesExpirationMutationVariables = Types.Exact<{
  ids: Array<Types.Scalars["String"]> | Types.Scalars["String"];
  expires_at: Types.Scalars["timestamptz"];
}>;

export type UpdateInvitesExpirationMutation = {
  __typename?: "mutation_root";
  invites?: {
    __typename?: "invite_mutation_response";
    returning: Array<{ __typename?: "invite"; id: string; email: string }>;
  } | null;
};

export const UpdateInvitesExpirationDocument = gql`
  mutation UpdateInvitesExpiration(
    $ids: [String!]!
    $expires_at: timestamptz!
  ) {
    invites: update_invite(
      where: { id: { _in: $ids } }
      _set: { expires_at: $expires_at }
    ) {
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
    UpdateInvitesExpiration(
      variables: UpdateInvitesExpirationMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateInvitesExpirationMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateInvitesExpirationMutation>(
            UpdateInvitesExpirationDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "UpdateInvitesExpiration",
        "mutation",
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
