/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateInvitesExpirationMutationVariables = Types.Exact<{
  ids:
    | Array<Types.Scalars["String"]["input"]>
    | Types.Scalars["String"]["input"];
  expires_at: Types.Scalars["timestamptz"]["input"];
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
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
