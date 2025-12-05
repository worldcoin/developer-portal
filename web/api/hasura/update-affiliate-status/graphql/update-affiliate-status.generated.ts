/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateAffiliateStatusMutationVariables = Types.Exact<{
  team_id: Types.Scalars["String"]["input"];
  status: Types.Scalars["String"]["input"];
}>;

export type UpdateAffiliateStatusMutation = {
  __typename?: "mutation_root";
  update_team_by_pk?: {
    __typename?: "team";
    id: string;
    affiliate_status: string;
  } | null;
};

export const UpdateAffiliateStatusDocument = gql`
  mutation UpdateAffiliateStatus($team_id: String!, $status: String!) {
    update_team_by_pk(
      pk_columns: { id: $team_id }
      _set: { affiliate_status: $status }
    ) {
      id
      affiliate_status
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
    UpdateAffiliateStatus(
      variables: UpdateAffiliateStatusMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateAffiliateStatusMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateAffiliateStatusMutation>(
            UpdateAffiliateStatusDocument,
            variables,
            {
              ...requestHeaders,
              ...wrappedRequestHeaders,
            },
          ),
        "UpdateAffiliateStatus",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
