/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type CreateEmptyLocalisationMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  locale: Types.Scalars["String"]["input"];
}>;

export type CreateEmptyLocalisationMutation = {
  __typename?: "mutation_root";
  insert_localisations_one?: {
    __typename?: "localisations";
    id: string;
  } | null;
};

export const CreateEmptyLocalisationDocument = gql`
  mutation CreateEmptyLocalisation(
    $app_metadata_id: String!
    $locale: String!
  ) {
    insert_localisations_one(
      object: { app_metadata_id: $app_metadata_id, locale: $locale }
    ) {
      id
    }
  }
`;
export type CreateEmptyLocalisationMutationFn = Apollo.MutationFunction<
  CreateEmptyLocalisationMutation,
  CreateEmptyLocalisationMutationVariables
>;

/**
 * __useCreateEmptyLocalisationMutation__
 *
 * To run a mutation, you first call `useCreateEmptyLocalisationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateEmptyLocalisationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createEmptyLocalisationMutation, { data, loading, error }] = useCreateEmptyLocalisationMutation({
 *   variables: {
 *      app_metadata_id: // value for 'app_metadata_id'
 *      locale: // value for 'locale'
 *   },
 * });
 */
export function useCreateEmptyLocalisationMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CreateEmptyLocalisationMutation,
    CreateEmptyLocalisationMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    CreateEmptyLocalisationMutation,
    CreateEmptyLocalisationMutationVariables
  >(CreateEmptyLocalisationDocument, options);
}
export type CreateEmptyLocalisationMutationHookResult = ReturnType<
  typeof useCreateEmptyLocalisationMutation
>;
export type CreateEmptyLocalisationMutationResult =
  Apollo.MutationResult<CreateEmptyLocalisationMutation>;
export type CreateEmptyLocalisationMutationOptions = Apollo.BaseMutationOptions<
  CreateEmptyLocalisationMutation,
  CreateEmptyLocalisationMutationVariables
>;
