/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetAppRpIdQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
}>;

export type GetAppRpIdQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    rp_registration: Array<{
      __typename?: "rp_registration";
      rp_id: string;
      status: unknown;
    }>;
  }>;
};

export const GetAppRpIdDocument = gql`
  query GetAppRpId($app_id: String!) {
    app(where: { id: { _eq: $app_id } }) {
      rp_registration {
        rp_id
        status
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
    GetAppRpId(
      variables: GetAppRpIdQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetAppRpIdQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetAppRpIdQuery>(GetAppRpIdDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "GetAppRpId",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
