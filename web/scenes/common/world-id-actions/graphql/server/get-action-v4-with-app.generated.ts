/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetActionV4WithAppQueryVariables = Types.Exact<{
  action_id: Types.Scalars["String"]["input"];
}>;

export type GetActionV4WithAppQuery = {
  __typename?: "query_root";
  action_v4_by_pk?: {
    __typename?: "action_v4";
    id: string;
    environment: unknown;
    rp_registration: { __typename?: "rp_registration"; app_id: string };
  } | null;
};

export const GetActionV4WithAppDocument = gql`
  query GetActionV4WithApp($action_id: String!) {
    action_v4_by_pk(id: $action_id) {
      id
      environment
      rp_registration {
        app_id
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
    GetActionV4WithApp(
      variables: GetActionV4WithAppQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetActionV4WithAppQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetActionV4WithAppQuery>(
            GetActionV4WithAppDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetActionV4WithApp",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
