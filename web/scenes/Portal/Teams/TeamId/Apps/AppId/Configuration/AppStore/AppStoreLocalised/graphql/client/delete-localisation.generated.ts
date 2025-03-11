/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type DeleteLocalisationMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  locale: Types.Scalars["String"]["input"];
}>;

export type DeleteLocalisationMutation = {
  __typename?: "mutation_root";
  delete_localisations?: {
    __typename?: "localisations_mutation_response";
    affected_rows: number;
  } | null;
};

export const DeleteLocalisationDocument = gql`
  mutation DeleteLocalisation($app_metadata_id: String!, $locale: String!) {
    delete_localisations(
      where: {
        app_metadata_id: { _eq: $app_metadata_id }
        locale: { _eq: $locale }
      }
    ) {
      affected_rows
    }
  }
`;
export type DeleteLocalisationMutationFn = Apollo.MutationFunction<
  DeleteLocalisationMutation,
  DeleteLocalisationMutationVariables
>;

/**
 * __useDeleteLocalisationMutation__
 *
 * To run a mutation, you first call `useDeleteLocalisationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteLocalisationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteLocalisationMutation, { data, loading, error }] = useDeleteLocalisationMutation({
 *   variables: {
 *      app_metadata_id: // value for 'app_metadata_id'
 *      locale: // value for 'locale'
 *   },
 * });
 */
export function useDeleteLocalisationMutation(
  baseOptions?: Apollo.MutationHookOptions<
    DeleteLocalisationMutation,
    DeleteLocalisationMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    DeleteLocalisationMutation,
    DeleteLocalisationMutationVariables
  >(DeleteLocalisationDocument, options);
}
export type DeleteLocalisationMutationHookResult = ReturnType<
  typeof useDeleteLocalisationMutation
>;
export type DeleteLocalisationMutationResult =
  Apollo.MutationResult<DeleteLocalisationMutation>;
export type DeleteLocalisationMutationOptions = Apollo.BaseMutationOptions<
  DeleteLocalisationMutation,
  DeleteLocalisationMutationVariables
>;
