/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type VerifyCreateActionMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"];
  external_nullifier: Types.Scalars["String"];
  action: Types.Scalars["String"];
}>;

export type VerifyCreateActionMutation = {
  __typename?: "mutation_root";
  insert_action_one?: {
    __typename?: "action";
    id: string;
    action: string;
    max_verifications: number;
    external_nullifier: string;
    status: string;
    nullifiers: Array<{
      __typename?: "nullifier";
      uses: number;
      created_at: any;
      nullifier_hash: string;
    }>;
  } | null;
};

export const VerifyCreateActionDocument = gql`
  mutation VerifyCreateAction(
    $app_id: String!
    $external_nullifier: String!
    $action: String!
  ) {
    insert_action_one(
      object: {
        app_id: $app_id
        external_nullifier: $external_nullifier
        action: $action
        name: ""
        description: ""
        creation_mode: "dynamic"
      }
    ) {
      id
      action
      max_verifications
      external_nullifier
      status
      nullifiers {
        uses
        created_at
        nullifier_hash
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
    VerifyCreateAction(
      variables: VerifyCreateActionMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<VerifyCreateActionMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<VerifyCreateActionMutation>(
            VerifyCreateActionDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "VerifyCreateAction",
        "mutation",
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
