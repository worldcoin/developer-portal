/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type SignupMutationVariables = Types.Exact<{
  nullifier_hash: Types.Scalars["String"];
  team_name: Types.Scalars["String"];
  ironclad_id: Types.Scalars["String"];
  auth0Id?: Types.InputMaybe<Types.Scalars["String"]>;
  name?: Types.InputMaybe<Types.Scalars["String"]>;
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
      world_id_nullifier: string;
      auth0Id?: string | null;
    }>;
  } | null;
};

export const SignupDocument = gql`
  mutation Signup(
    $nullifier_hash: String!
    $team_name: String!
    $ironclad_id: String!
    $auth0Id: String
    $name: String = ""
  ) {
    insert_team_one(
      object: {
        name: $team_name
        users: {
          data: {
            ironclad_id: $ironclad_id
            world_id_nullifier: $nullifier_hash
            auth0Id: $auth0Id
            name: $name
          }
        }
      }
    ) {
      id
      name
      users {
        id
        ironclad_id
        world_id_nullifier
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
