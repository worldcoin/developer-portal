/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpdateLocalisationMutationVariables = Types.Exact<{
  localisation_id: Types.Scalars["String"];
  input?: Types.InputMaybe<Types.Localisations_Set_Input>;
}>;

export type UpdateLocalisationMutation = {
  __typename?: "mutation_root";
  update_localisations_by_pk?: {
    __typename?: "localisations";
    id: string;
  } | null;
};

export const UpdateLocalisationDocument = gql`
  mutation UpdateLocalisation(
    $localisation_id: String!
    $input: localisations_set_input
  ) {
    update_localisations_by_pk(
      pk_columns: { id: $localisation_id }
      _set: $input
    ) {
      id
    }
  }
`;
export type UpdateLocalisationMutationFn = Apollo.MutationFunction<
  UpdateLocalisationMutation,
  UpdateLocalisationMutationVariables
>;

/**
 * __useUpdateLocalisationMutation__
 *
 * To run a mutation, you first call `useUpdateLocalisationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateLocalisationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateLocalisationMutation, { data, loading, error }] = useUpdateLocalisationMutation({
 *   variables: {
 *      localisation_id: // value for 'localisation_id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateLocalisationMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateLocalisationMutation,
    UpdateLocalisationMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateLocalisationMutation,
    UpdateLocalisationMutationVariables
  >(UpdateLocalisationDocument, options);
}
export type UpdateLocalisationMutationHookResult = ReturnType<
  typeof useUpdateLocalisationMutation
>;
export type UpdateLocalisationMutationResult =
  Apollo.MutationResult<UpdateLocalisationMutation>;
export type UpdateLocalisationMutationOptions = Apollo.BaseMutationOptions<
  UpdateLocalisationMutation,
  UpdateLocalisationMutationVariables
>;
