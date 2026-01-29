/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];

export type FetchAppByRpIdQueryVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
}>;

export type FetchAppByRpIdQuery = {
  __typename?: "query_root";
  rp_registration: Array<{
    __typename?: "rp_registration";
    rp_id: string;
    app_id: string;
    status: string;
    app: {
      __typename?: "app";
      id: string;
      is_staging: boolean;
      status: string;
      is_archived: boolean;
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
    };
  }>;
};

export const FetchAppByRpIdDocument = gql`
  query FetchAppByRpId($rp_id: String!) {
    rp_registration(where: { rp_id: { _eq: $rp_id } }) {
      rp_id
      app_id
      status
      app {
        id
        is_staging
        status
        is_archived
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
    FetchAppByRpId(
      variables: FetchAppByRpIdQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAppByRpIdQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAppByRpIdQuery>(
            FetchAppByRpIdDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchAppByRpId",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
