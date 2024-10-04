/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type AddLocaleMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  supported_languages?: Types.InputMaybe<
    Array<Types.Scalars["String"]["input"]> | Types.Scalars["String"]["input"]
  >;
}>;

export type AddLocaleMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
};

export const AddLocaleDocument = gql`
  mutation AddLocale(
    $app_metadata_id: String!
    $supported_languages: [String!]
  ) {
    update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: { supported_languages: $supported_languages }
    ) {
      id
    }
  }
`;
export type AddLocaleMutationFn = Apollo.MutationFunction<
  AddLocaleMutation,
  AddLocaleMutationVariables
>;

/**
 * __useAddLocaleMutation__
 *
 * To run a mutation, you first call `useAddLocaleMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddLocaleMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addLocaleMutation, { data, loading, error }] = useAddLocaleMutation({
 *   variables: {
 *      app_metadata_id: // value for 'app_metadata_id'
 *      supported_languages: // value for 'supported_languages'
 *   },
 * });
 */
export function useAddLocaleMutation(
  baseOptions?: Apollo.MutationHookOptions<
    AddLocaleMutation,
    AddLocaleMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<AddLocaleMutation, AddLocaleMutationVariables>(
    AddLocaleDocument,
    options,
  );
}
export type AddLocaleMutationHookResult = ReturnType<
  typeof useAddLocaleMutation
>;
export type AddLocaleMutationResult = Apollo.MutationResult<AddLocaleMutation>;
export type AddLocaleMutationOptions = Apollo.BaseMutationOptions<
  AddLocaleMutation,
  AddLocaleMutationVariables
>;
