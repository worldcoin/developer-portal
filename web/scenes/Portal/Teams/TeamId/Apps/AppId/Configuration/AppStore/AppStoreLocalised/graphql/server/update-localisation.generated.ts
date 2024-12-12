/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateLocalisationMutationVariables = Types.Exact<{
  localisation_id: Types.Scalars["String"]["input"];
  input?: Types.InputMaybe<Types.Localisations_Set_Input>;
}>;

export type UpdateLocalisationMutation = {
  __typename?: "mutation_root";
  update_localisations_by_pk?: {
    __typename?: "localisations";
    id: string;
  } | null;
};

export const UpdateLocalisationDocument = gql`
  mutation UpdateLocalisation(
    $localisation_id: String!
    $input: localisations_set_input
  ) {
    update_localisations_by_pk(
      pk_columns: { id: $localisation_id }
      _set: $input
    ) {
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
    UpdateLocalisation(
      variables: UpdateLocalisationMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateLocalisationMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateLocalisationMutation>(
            UpdateLocalisationDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "UpdateLocalisation",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
