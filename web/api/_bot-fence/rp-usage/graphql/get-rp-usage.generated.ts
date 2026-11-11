/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetRpUsageQueryVariables = Types.Exact<{
  rp_id: Types.Scalars["String"]["input"];
  environment: Types.Scalars["action_environment"]["input"];
  from: Types.Scalars["timestamptz"]["input"];
  to: Types.Scalars["timestamptz"]["input"];
}>;

export type GetRpUsageQuery = {
  __typename?: "query_root";
  nullifier_v4_aggregate: {
    __typename?: "nullifier_v4_aggregate";
    aggregate?: {
      __typename?: "nullifier_v4_aggregate_fields";
      count: number;
      min?: {
        __typename?: "nullifier_v4_min_fields";
        created_at?: string | null;
      } | null;
    } | null;
  };
};

export const GetRpUsageDocument = gql`
  query GetRpUsage(
    $rp_id: String!
    $environment: action_environment!
    $from: timestamptz!
    $to: timestamptz!
  ) {
    nullifier_v4_aggregate(
      where: {
        created_at: { _gte: $from, _lt: $to }
        action_v4: {
          rp_id: { _eq: $rp_id }
          environment: { _eq: $environment }
          action: { _regex: "^wid/waf/[0-9]+/[0-9]+(/[0-9]+)?$" }
        }
      }
    ) {
      aggregate {
        count
        min {
          created_at
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
    GetRpUsage(
      variables: GetRpUsageQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetRpUsageQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetRpUsageQuery>(GetRpUsageDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "GetRpUsage",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
