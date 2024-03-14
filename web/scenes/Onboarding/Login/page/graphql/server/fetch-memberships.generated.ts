/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type FetchMembershipsQueryVariables = Types.Exact<{
  userId: Types.Scalars["String"];
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
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;

