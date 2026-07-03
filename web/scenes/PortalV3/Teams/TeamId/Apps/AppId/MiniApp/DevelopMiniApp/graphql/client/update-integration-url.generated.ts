/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpdateIntegrationUrlMutationVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
  integration_url: Types.Scalars["String"]["input"];
}>;

export type UpdateIntegrationUrlMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
    integration_url: string;
  } | null;
};

export const UpdateIntegrationUrlDocument = gql`
  mutation UpdateIntegrationUrl($id: String!, $integration_url: String!) {
    update_app_metadata_by_pk(
      pk_columns: { id: $id }
      _set: { integration_url: $integration_url }
    ) {
      id
      integration_url
    }
  }
`;
export type UpdateIntegrationUrlMutationFn = Apollo.MutationFunction<
  UpdateIntegrationUrlMutation,
  UpdateIntegrationUrlMutationVariables
>;

/**
 * __useUpdateIntegrationUrlMutation__
 *
 * To run a mutation, you first call `useUpdateIntegrationUrlMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateIntegrationUrlMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateIntegrationUrlMutation, { data, loading, error }] = useUpdateIntegrationUrlMutation({
 *   variables: {
 *      id: // value for 'id'
 *      integration_url: // value for 'integration_url'
 *   },
 * });
 */
export function useUpdateIntegrationUrlMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateIntegrationUrlMutation,
    UpdateIntegrationUrlMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateIntegrationUrlMutation,
    UpdateIntegrationUrlMutationVariables
  >(UpdateIntegrationUrlDocument, options);
}
export type UpdateIntegrationUrlMutationHookResult = ReturnType<
  typeof useUpdateIntegrationUrlMutation
>;
export type UpdateIntegrationUrlMutationResult =
  Apollo.MutationResult<UpdateIntegrationUrlMutation>;
export type UpdateIntegrationUrlMutationOptions = Apollo.BaseMutationOptions<
  UpdateIntegrationUrlMutation,
  UpdateIntegrationUrlMutationVariables
>;
