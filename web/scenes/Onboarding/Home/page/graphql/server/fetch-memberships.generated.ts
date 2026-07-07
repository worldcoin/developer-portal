/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchMembershipsQueryVariables = Types.Exact<{
  userId: Types.Scalars["String"]["input"];
}>;

export type FetchMembershipsQuery = {
  __typename?: "query_root";
  membership: Array<{ __typename?: "membership"; team_id: string }>;
};

export const FetchMembershipsDocument = gql`
  query FetchMemberships($userId: String!) {
    membership(where: { user_id: { _eq: $userId } }) {
      team_id
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
    FetchMemberships(
      variables: FetchMembershipsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchMembershipsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchMembershipsQuery>(
            FetchMembershipsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchMemberships",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
