/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type DeleteLocalisationMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  locale: Types.Scalars["String"]["input"];
}>;

export type DeleteLocalisationMutation = {
  __typename?: "mutation_root";
  delete_localisations?: {
    __typename?: "localisations_mutation_response";
    affected_rows: number;
  } | null;
};

export const DeleteLocalisationDocument = gql`
  mutation DeleteLocalisation($app_metadata_id: String!, $locale: String!) {
    delete_localisations(
      where: {
        app_metadata_id: { _eq: $app_metadata_id }
        locale: { _eq: $locale }
      }
    ) {
      affected_rows
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
    DeleteLocalisation(
      variables: DeleteLocalisationMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<DeleteLocalisationMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<DeleteLocalisationMutation>(
            DeleteLocalisationDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "DeleteLocalisation",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
