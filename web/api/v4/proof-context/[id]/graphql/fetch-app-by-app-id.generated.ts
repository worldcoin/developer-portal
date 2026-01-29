/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];

export type FetchAppByAppIdQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
}>;

export type FetchAppByAppIdQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    id: string;
    is_staging: boolean;
    app_metadata: Array<{
      __typename?: "app_metadata";
      name: string;
      integration_url: string;
    }>;
    verified_app_metadata: Array<{
      __typename?: "app_metadata";
      name: string;
      logo_img_url: string;
      integration_url: string;
    }>;
    rp_registration: Array<{
      __typename?: "rp_registration";
      rp_id: string;
      status: string;
    }>;
  }>;
};

export const FetchAppByAppIdDocument = gql`
  query FetchAppByAppId($app_id: String!) {
    app(
      where: {
        id: { _eq: $app_id }
        status: { _eq: "active" }
        is_archived: { _eq: false }
      }
    ) {
      id
      is_staging
      app_metadata(where: { verification_status: { _neq: "verified" } }) {
        name
        integration_url
      }
      verified_app_metadata: app_metadata(
        where: { verification_status: { _eq: "verified" } }
      ) {
        name
        logo_img_url
        integration_url
      }
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
    FetchAppByAppId(
      variables: FetchAppByAppIdQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAppByAppIdQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAppByAppIdQuery>(
            FetchAppByAppIdDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchAppByAppId",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
