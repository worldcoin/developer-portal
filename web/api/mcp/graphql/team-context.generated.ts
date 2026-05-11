/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type McpTeamContextQueryVariables = Types.Exact<{
  team_id: Types.Scalars["String"]["input"];
}>;

export type McpTeamContextQuery = {
  __typename?: "query_root";
  team_by_pk?: {
    __typename?: "team";
    id: string;
    name?: string | null;
    apps: Array<{
      __typename?: "app";
      id: string;
      name: string;
      engine: string;
      is_staging: boolean;
      status: string;
      created_at: string;
      app_metadata: Array<{
        __typename?: "app_metadata";
        id: string;
        name: string;
        app_mode: string;
        category: string;
        integration_url: string;
        verification_status: string;
      }>;
      rp_registration: Array<{
        __typename?: "rp_registration";
        rp_id: string;
        mode: unknown;
        status: unknown;
        signer_address?: string | null;
        staging_status?: unknown | null;
      }>;
    }>;
  } | null;
};

export const McpTeamContextDocument = gql`
  query McpTeamContext($team_id: String!) {
    team_by_pk(id: $team_id) {
      id
      name
      apps(
        where: { deleted_at: { _is_null: true } }
        order_by: { created_at: desc }
      ) {
        id
        name
        engine
        is_staging
        status
        created_at
        app_metadata(
          where: { verification_status: { _neq: "verified" } }
          order_by: { created_at: desc }
          limit: 1
        ) {
          id
          name
          app_mode
          category
          integration_url
          verification_status
        }
        rp_registration {
          rp_id
          mode
          status
          signer_address
          staging_status
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
    McpTeamContext(
      variables: McpTeamContextQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<McpTeamContextQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<McpTeamContextQuery>(
            McpTeamContextDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "McpTeamContext",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
