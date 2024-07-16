/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type InsertLocalisationMutationVariables = Types.Exact<{
  input: Types.Localisations_Insert_Input;
}>;

export type InsertLocalisationMutation = {
  __typename?: "mutation_root";
  insert_localisations_one?: {
    __typename?: "localisations";
    id: string;
  } | null;
};

export const InsertLocalisationDocument = gql`
  mutation InsertLocalisation($input: localisations_insert_input!) {
    insert_localisations_one(object: $input) {
      id
    }
  }
`;
export type InsertLocalisationMutationFn = Apollo.MutationFunction<
  InsertLocalisationMutation,
  InsertLocalisationMutationVariables
>;

/**
 * __useInsertLocalisationMutation__
 *
 * To run a mutation, you first call `useInsertLocalisationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useInsertLocalisationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [insertLocalisationMutation, { data, loading, error }] = useInsertLocalisationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useInsertLocalisationMutation(
  baseOptions?: Apollo.MutationHookOptions<
    InsertLocalisationMutation,
    InsertLocalisationMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    InsertLocalisationMutation,
    InsertLocalisationMutationVariables
  >(InsertLocalisationDocument, options);
}
export type InsertLocalisationMutationHookResult = ReturnType<
  typeof useInsertLocalisationMutation
>;
export type InsertLocalisationMutationResult =
  Apollo.MutationResult<InsertLocalisationMutation>;
export type InsertLocalisationMutationOptions = Apollo.BaseMutationOptions<
  InsertLocalisationMutation,
  InsertLocalisationMutationVariables
>;
