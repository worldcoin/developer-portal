/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type SubmitAppMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"];
  verification_status: Types.Scalars["String"];
  is_developer_allow_listing: Types.Scalars["Boolean"];
}>;

export type SubmitAppMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
};

export const SubmitAppDocument = gql`
  mutation SubmitApp(
    $app_metadata_id: String!
    $verification_status: String!
    $is_developer_allow_listing: Boolean!
  ) {
    update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: {
        verification_status: $verification_status
        is_developer_allow_listing: $is_developer_allow_listing
      }
    ) {
      id
    }
  }
`;
export type SubmitAppMutationFn = Apollo.MutationFunction<
  SubmitAppMutation,
  SubmitAppMutationVariables
>;

/**
 * __useSubmitAppMutation__
 *
 * To run a mutation, you first call `useSubmitAppMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSubmitAppMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [submitAppMutation, { data, loading, error }] = useSubmitAppMutation({
 *   variables: {
 *      app_metadata_id: // value for 'app_metadata_id'
 *      verification_status: // value for 'verification_status'
 *      is_developer_allow_listing: // value for 'is_developer_allow_listing'
 *   },
 * });
 */
export function useSubmitAppMutation(
  baseOptions?: Apollo.MutationHookOptions<
    SubmitAppMutation,
    SubmitAppMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<SubmitAppMutation, SubmitAppMutationVariables>(
    SubmitAppDocument,
    options,
  );
}
export type SubmitAppMutationHookResult = ReturnType<
  typeof useSubmitAppMutation
>;
export type SubmitAppMutationResult = Apollo.MutationResult<SubmitAppMutation>;
export type SubmitAppMutationOptions = Apollo.BaseMutationOptions<
  SubmitAppMutation,
  SubmitAppMutationVariables
>;
