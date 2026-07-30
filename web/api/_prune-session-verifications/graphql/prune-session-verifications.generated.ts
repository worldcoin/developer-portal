/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type PruneSessionVerificationsMutationVariables = Types.Exact<{
  [key: string]: never;
}>;

export type PruneSessionVerificationsMutation = {
  __typename?: "mutation_root";
  prune_session_verifications: Array<{
    __typename?: "v4_analytics_state";
    key: string;
    timestamp_value: string;
  }>;
};

export const PruneSessionVerificationsDocument = gql`
  mutation PruneSessionVerifications {
    prune_session_verifications {
      key
      timestamp_value
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
    PruneSessionVerifications(
      variables?: PruneSessionVerificationsMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<PruneSessionVerificationsMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<PruneSessionVerificationsMutation>(
            PruneSessionVerificationsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "PruneSessionVerifications",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
