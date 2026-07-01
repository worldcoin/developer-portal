/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateActionMutationVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
  input?: Types.InputMaybe<Types.Action_Set_Input>;
}>;

export type UpdateActionMutation = {
  __typename?: "mutation_root";
  update_action_by_pk?: {
    __typename?: "action";
    id: string;
    name: string;
    description: string;
    max_verifications: number;
    status: string;
    app_flow_on_complete?: unknown | null;
    webhook_uri?: string | null;
    webhook_pem?: string | null;
    post_action_deep_link_ios?: string | null;
    post_action_deep_link_android?: string | null;
  } | null;
};

export const UpdateActionDocument = gql`
  mutation UpdateAction($id: String!, $input: action_set_input) {
    update_action_by_pk(pk_columns: { id: $id }, _set: $input) {
      id
      name
      description
      max_verifications
      status
      app_flow_on_complete
      webhook_uri
      webhook_pem
      post_action_deep_link_ios
      post_action_deep_link_android
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
    UpdateAction(
      variables: UpdateActionMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateActionMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateActionMutation>(
            UpdateActionDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "UpdateAction",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
