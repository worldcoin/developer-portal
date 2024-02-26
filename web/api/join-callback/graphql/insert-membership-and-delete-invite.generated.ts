/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type InsertMembershipMutationVariables = Types.Exact<{
  team_id: Types.Scalars["String"];
  user_id?: Types.InputMaybe<Types.Scalars["String"]>;
  role?: Types.InputMaybe<Types.Role_Enum>;
  invite_id: Types.Scalars["String"];
}>;

export type InsertMembershipMutation = {
  __typename?: "mutation_root";
  insert_membership_one?: {
    __typename?: "membership";
    team_id: string;
    role: Types.Role_Enum;
    user: {
      __typename?: "user";
      id: string;
      email?: string | null;
      name: string;
      auth0Id?: string | null;
      posthog_id?: string | null;
      memberships: Array<{
        __typename?: "membership";
        role: Types.Role_Enum;
        team: { __typename?: "team"; id: string; name?: string | null };
      }>;
    };
  } | null;
  delete_invite_by_pk?: { __typename?: "invite"; id: string } | null;
};

export const InsertMembershipDocument = gql`
  mutation InsertMembership(
    $team_id: String!
    $user_id: String
    $role: role_enum
    $invite_id: String!
  ) {
    insert_membership_one(
      object: { team_id: $team_id, user_id: $user_id, role: $role }
    ) {
      user {
        id
        email
        name
        auth0Id
        posthog_id
        name
        memberships {
          team {
            id
            name
          }
          role
        }
      }
      team_id
      role
    }
    delete_invite_by_pk(id: $invite_id) {
      id
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
    InsertMembership(
      variables: InsertMembershipMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<InsertMembershipMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<InsertMembershipMutation>(
            InsertMembershipDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "InsertMembership",
        "mutation",
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
