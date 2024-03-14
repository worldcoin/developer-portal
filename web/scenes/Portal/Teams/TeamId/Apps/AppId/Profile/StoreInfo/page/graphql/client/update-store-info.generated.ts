/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpdateAppStoreInfoMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"];
  description: Types.Scalars["String"];
  world_app_description: Types.Scalars["String"];
}>;

export type UpdateAppStoreInfoMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
};

export const UpdateAppStoreInfoDocument = gql`
  mutation UpdateAppStoreInfo(
    $app_metadata_id: String!
    $description: String!
    $world_app_description: String!
  ) {
    update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: {
        description: $description
        world_app_description: $world_app_description
      }
    ) {
      id
    }
  }
`;
export type UpdateAppStoreInfoMutationFn = Apollo.MutationFunction<
  UpdateAppStoreInfoMutation,
  UpdateAppStoreInfoMutationVariables
>;

/**
 * __useUpdateAppStoreInfoMutation__
 *
 * To run a mutation, you first call `useUpdateAppStoreInfoMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateAppStoreInfoMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateAppStoreInfoMutation, { data, loading, error }] = useUpdateAppStoreInfoMutation({
 *   variables: {
 *      app_metadata_id: // value for 'app_metadata_id'
 *      description: // value for 'description'
 *      world_app_description: // value for 'world_app_description'
 *   },
 * });
 */
export function useUpdateAppStoreInfoMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateAppStoreInfoMutation,
    UpdateAppStoreInfoMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateAppStoreInfoMutation,
    UpdateAppStoreInfoMutationVariables
  >(UpdateAppStoreInfoDocument, options);
}
export type UpdateAppStoreInfoMutationHookResult = ReturnType<
  typeof useUpdateAppStoreInfoMutation
>;
export type UpdateAppStoreInfoMutationResult =
  Apollo.MutationResult<UpdateAppStoreInfoMutation>;
export type UpdateAppStoreInfoMutationOptions = Apollo.BaseMutationOptions<
  UpdateAppStoreInfoMutation,
  UpdateAppStoreInfoMutationVariables
>;

