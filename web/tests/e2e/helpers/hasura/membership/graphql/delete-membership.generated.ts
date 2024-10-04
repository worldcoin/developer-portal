/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type DeleteMembershipMutationVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type DeleteMembershipMutation = {
  __typename?: "mutation_root";
  delete_membership_by_pk?: { __typename?: "membership"; id: string } | null;
};

export const DeleteMembershipDocument = gql`
  mutation DeleteMembership($id: String!) {
    delete_membership_by_pk(id: $id) {
      id
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
    DeleteMembership(
      variables: DeleteMembershipMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<DeleteMembershipMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<DeleteMembershipMutation>(
            DeleteMembershipDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "DeleteMembership",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
