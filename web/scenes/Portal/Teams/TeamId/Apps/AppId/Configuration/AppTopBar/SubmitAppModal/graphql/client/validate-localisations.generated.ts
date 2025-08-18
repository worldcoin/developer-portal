/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type ValidateLocalisationMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  team_id: Types.Scalars["String"]["input"];
}>;

export type ValidateLocalisationMutation = {
  __typename?: "mutation_root";
  validate_localisation?: {
    __typename?: "ValidateLocalisationOutput";
    success?: boolean | null;
  } | null;
};

export const ValidateLocalisationDocument = gql`
  mutation ValidateLocalisation($app_metadata_id: String!, $team_id: String!) {
    validate_localisation(
      app_metadata_id: $app_metadata_id
      team_id: $team_id
    ) {
      success
    }
  }
`;
export type ValidateLocalisationMutationFn = Apollo.MutationFunction<
  ValidateLocalisationMutation,
  ValidateLocalisationMutationVariables
>;

/**
 * __useValidateLocalisationMutation__
 *
 * To run a mutation, you first call `useValidateLocalisationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useValidateLocalisationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [validateLocalisationMutation, { data, loading, error }] = useValidateLocalisationMutation({
 *   variables: {
 *      app_metadata_id: // value for 'app_metadata_id'
 *      team_id: // value for 'team_id'
 *   },
 * });
 */
export function useValidateLocalisationMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ValidateLocalisationMutation,
    ValidateLocalisationMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    ValidateLocalisationMutation,
    ValidateLocalisationMutationVariables
  >(ValidateLocalisationDocument, options);
}
export type ValidateLocalisationMutationHookResult = ReturnType<
  typeof useValidateLocalisationMutation
>;
export type ValidateLocalisationMutationResult =
  Apollo.MutationResult<ValidateLocalisationMutation>;
export type ValidateLocalisationMutationOptions = Apollo.BaseMutationOptions<
  ValidateLocalisationMutation,
  ValidateLocalisationMutationVariables
>;
