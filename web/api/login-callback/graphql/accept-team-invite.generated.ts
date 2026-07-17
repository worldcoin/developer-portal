/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type AcceptTeamInviteMutationVariables = Types.Exact<{
  invite_id: Types.Scalars["String"]["input"];
  team_id: Types.Scalars["String"]["input"];
  user_id: Types.Scalars["String"]["input"];
}>;

export type AcceptTeamInviteMutation = {
  __typename?: "mutation_root";
  accept_team_invite: Array<{
    __typename?: "membership";
    team_id: string;
    role: Types.Role_Enum;
    team: { __typename?: "team"; id: string; name?: string | null };
    user: {
      __typename?: "user";
      id: string;
      email?: string | null;
      name: string;
      auth0Id?: string | null;
      posthog_id?: string | null;
      is_allow_tracking?: boolean | null;
      memberships: Array<{
        __typename?: "membership";
        role: Types.Role_Enum;
        team: { __typename?: "team"; id: string; name?: string | null };
      }>;
    };
  }>;
};

export const AcceptTeamInviteDocument = gql`
  mutation AcceptTeamInvite(
    $invite_id: String!
    $team_id: String!
    $user_id: String!
  ) {
    accept_team_invite(
      args: { _invite_id: $invite_id, _team_id: $team_id, _user_id: $user_id }
    ) {
      team_id
      role
      team {
        id
        name
      }
      user {
        id
        email
        name
        auth0Id
        posthog_id
        is_allow_tracking
        memberships {
          team {
            id
            name
          }
          role
        }
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
    AcceptTeamInvite(
      variables: AcceptTeamInviteMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<AcceptTeamInviteMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<AcceptTeamInviteMutation>(
            AcceptTeamInviteDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "AcceptTeamInvite",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
