/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type GetAppWebHighLightsQueryVariables = Types.Exact<{
  [key: string]: never;
}>;

export type GetAppWebHighLightsQuery = {
  __typename?: "query_root";
  app_rankings: Array<{ __typename?: "app_rankings"; rankings?: any | null }>;
};

export const GetAppWebHighLightsDocument = gql`
  query GetAppWebHighLights {
    app_rankings(
      where: { platform: { _eq: "web" }, country: { _eq: "featured" } }
    ) {
      rankings
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
    GetAppWebHighLights(
      variables?: GetAppWebHighLightsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetAppWebHighLightsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetAppWebHighLightsQuery>(
            GetAppWebHighLightsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetAppWebHighLights",
        "query",
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
