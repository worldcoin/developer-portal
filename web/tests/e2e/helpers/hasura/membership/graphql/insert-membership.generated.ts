/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type InsertMembershipMutationVariables = Types.Exact<{
  object: Types.Membership_Insert_Input;
}>;

export type InsertMembershipMutation = {
  __typename?: "mutation_root";
  insert_membership_one?: { __typename?: "membership"; id: string } | null;
};

export const InsertMembershipDocument = gql`
  mutation InsertMembership($object: membership_insert_input!) {
    insert_membership_one(object: $object) {
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
