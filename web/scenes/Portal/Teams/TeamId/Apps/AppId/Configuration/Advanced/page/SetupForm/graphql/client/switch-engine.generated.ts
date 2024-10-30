/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpdateEngineMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  engine: Types.Scalars["String"]["input"];
}>;

export type UpdateEngineMutation = {
  __typename?: "mutation_root";
  update_app_by_pk?: { __typename?: "app"; engine: string } | null;
};

export const UpdateEngineDocument = gql`
  mutation updateEngine($app_id: String!, $engine: String!) {
    update_app_by_pk(pk_columns: { id: $app_id }, _set: { engine: $engine }) {
      engine
    }
  }
`;
export type UpdateEngineMutationFn = Apollo.MutationFunction<
  UpdateEngineMutation,
  UpdateEngineMutationVariables
>;

/**
 * __useUpdateEngineMutation__
 *
 * To run a mutation, you first call `useUpdateEngineMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateEngineMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateEngineMutation, { data, loading, error }] = useUpdateEngineMutation({
 *   variables: {
 *      app_id: // value for 'app_id'
 *      engine: // value for 'engine'
 *   },
 * });
 */
export function useUpdateEngineMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateEngineMutation,
    UpdateEngineMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateEngineMutation,
    UpdateEngineMutationVariables
  >(UpdateEngineDocument, options);
}
export type UpdateEngineMutationHookResult = ReturnType<
  typeof useUpdateEngineMutation
>;
export type UpdateEngineMutationResult =
  Apollo.MutationResult<UpdateEngineMutation>;
export type UpdateEngineMutationOptions = Apollo.BaseMutationOptions<
  UpdateEngineMutation,
  UpdateEngineMutationVariables
>;
