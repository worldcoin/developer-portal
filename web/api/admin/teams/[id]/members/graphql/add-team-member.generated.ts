/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type AddTeamMemberMutationVariables = Types.Exact<{
  object: Types.Membership_Insert_Input;
}>;

export type AddTeamMemberMutation = {
  __typename?: "mutation_root";
  insert_membership_one?: {
    __typename?: "membership";
    id: string;
    role: Types.Role_Enum;
  } | null;
};

export const AddTeamMemberDocument = gql`
  mutation AddTeamMember($object: membership_insert_input!) {
    insert_membership_one(object: $object) {
      id
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
    AddTeamMember(
      variables: AddTeamMemberMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<AddTeamMemberMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<AddTeamMemberMutation>(
            AddTeamMemberDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "AddTeamMember",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
