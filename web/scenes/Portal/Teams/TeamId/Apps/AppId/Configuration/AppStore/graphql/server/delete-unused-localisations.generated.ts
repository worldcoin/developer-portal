/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type DeleteUnusedLocalisationsMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  languages_to_keep:
    | Array<Types.Scalars["String"]["input"]>
    | Types.Scalars["String"]["input"];
}>;

export type DeleteUnusedLocalisationsMutation = {
  __typename?: "mutation_root";
  delete_localisations?: {
    __typename?: "localisations_mutation_response";
    affected_rows: number;
    returning: Array<{
      __typename?: "localisations";
      id: string;
      locale: string;
    }>;
  } | null;
};

export const DeleteUnusedLocalisationsDocument = gql`
  mutation DeleteUnusedLocalisations(
    $app_metadata_id: String!
    $languages_to_keep: [String!]!
  ) {
    delete_localisations(
      where: {
        app_metadata_id: { _eq: $app_metadata_id }
        locale: { _nin: $languages_to_keep }
      }
    ) {
      affected_rows
      returning {
        id
        locale
      }
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
    DeleteUnusedLocalisations(
      variables: DeleteUnusedLocalisationsMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<DeleteUnusedLocalisationsMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<DeleteUnusedLocalisationsMutation>(
            DeleteUnusedLocalisationsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "DeleteUnusedLocalisations",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
