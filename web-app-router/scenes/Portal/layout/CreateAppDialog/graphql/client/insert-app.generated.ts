/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type InsertAppMutationVariables = Types.Exact<{
  name: Types.Scalars["String"];
  engine: Types.Scalars["String"];
  category: Types.Scalars["String"];
  is_staging: Types.Scalars["Boolean"];
}>;

export type InsertAppMutation = {
  __typename?: "mutation_root";
  insert_app_one?: { __typename?: "app"; id: string } | null;
};

export const InsertAppDocument = gql`
  mutation InsertApp(
    $name: String!
    $engine: String!
    $category: String!
    $is_staging: Boolean!
  ) {
    insert_app_one(
      object: {
        engine: $engine
        app_metadata: { data: { category: $category, name: $name } }
        name: $name
        is_staging: $is_staging
      }
    ) {
      id
    }
  }
`;
export type InsertAppMutationFn = Apollo.MutationFunction<
  InsertAppMutation,
  InsertAppMutationVariables
>;

/**
 * __useInsertAppMutation__
 *
 * To run a mutation, you first call `useInsertAppMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useInsertAppMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [insertAppMutation, { data, loading, error }] = useInsertAppMutation({
 *   variables: {
 *      name: // value for 'name'
 *      engine: // value for 'engine'
 *      category: // value for 'category'
 *      is_staging: // value for 'is_staging'
 *   },
 * });
 */
export function useInsertAppMutation(
  baseOptions?: Apollo.MutationHookOptions<
    InsertAppMutation,
    InsertAppMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<InsertAppMutation, InsertAppMutationVariables>(
    InsertAppDocument,
    options,
  );
}
export type InsertAppMutationHookResult = ReturnType<
  typeof useInsertAppMutation
>;
export type InsertAppMutationResult = Apollo.MutationResult<InsertAppMutation>;
export type InsertAppMutationOptions = Apollo.BaseMutationOptions<
  InsertAppMutation,
  InsertAppMutationVariables
>;
