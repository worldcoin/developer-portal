/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type CreateEditableRowMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  team_id: Types.Scalars["String"]["input"];
}>;

export type CreateEditableRowMutation = {
  __typename?: "mutation_root";
  create_new_draft?: {
    __typename?: "CreateNewDraftOutput";
    success?: boolean | null;
  } | null;
};

export const CreateEditableRowDocument = gql`
  mutation CreateEditableRow($app_id: String!, $team_id: String!) {
    create_new_draft(app_id: $app_id, team_id: $team_id) {
      success
    }
  }
`;
export type CreateEditableRowMutationFn = Apollo.MutationFunction<
  CreateEditableRowMutation,
  CreateEditableRowMutationVariables
>;

/**
 * __useCreateEditableRowMutation__
 *
 * To run a mutation, you first call `useCreateEditableRowMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateEditableRowMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createEditableRowMutation, { data, loading, error }] = useCreateEditableRowMutation({
 *   variables: {
 *      app_id: // value for 'app_id'
 *      team_id: // value for 'team_id'
 *   },
 * });
 */
export function useCreateEditableRowMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CreateEditableRowMutation,
    CreateEditableRowMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    CreateEditableRowMutation,
    CreateEditableRowMutationVariables
  >(CreateEditableRowDocument, options);
}
export type CreateEditableRowMutationHookResult = ReturnType<
  typeof useCreateEditableRowMutation
>;
export type CreateEditableRowMutationResult =
  Apollo.MutationResult<CreateEditableRowMutation>;
export type CreateEditableRowMutationOptions = Apollo.BaseMutationOptions<
  CreateEditableRowMutation,
  CreateEditableRowMutationVariables
>;
