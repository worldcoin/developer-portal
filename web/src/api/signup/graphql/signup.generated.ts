/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type SignupMutationVariables = Types.Exact<{
  team_name: Types.Scalars["String"];
  data: Array<Types.User_Insert_Input> | Types.User_Insert_Input;
}>;

export type SignupMutation = {
  __typename?: "mutation_root";
  insert_team_one?: {
    __typename?: "team";
    id: string;
    name?: string | null;
    users: Array<{
      __typename?: "user";
      id: string;
      ironclad_id: string;
      world_id_nullifier?: string | null;
      posthog_id?: string | null;
      auth0Id?: string | null;
    }>;
  } | null;
};

export const SignupDocument = gql`
  mutation Signup($team_name: String!, $data: [user_insert_input!]!) {
    insert_team_one(object: { name: $team_name, users: { data: $data } }) {
      id
      name
      users {
        id
        ironclad_id
        world_id_nullifier
        posthog_id
        auth0Id
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
    Signup(
      variables: SignupMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders
    ): Promise<SignupMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<SignupMutation>(SignupDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "Signup",
        "mutation"
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
