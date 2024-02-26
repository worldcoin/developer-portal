/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type UpdateUserMutationVariables = Types.Exact<{
  id: Types.Scalars["String"];
  _set?: Types.InputMaybe<Types.User_Set_Input>;
}>;

export type UpdateUserMutation = {
  __typename?: "mutation_root";
  update_user_by_pk?: {
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
  } | null;
};

export const UpdateUserDocument = gql`
  mutation UpdateUser($id: String!, $_set: user_set_input) {
    update_user_by_pk(pk_columns: { id: $id }, _set: $_set) {
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
    UpdateUser(
      variables: UpdateUserMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateUserMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateUserMutation>(UpdateUserDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "UpdateUser",
        "mutation",
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
