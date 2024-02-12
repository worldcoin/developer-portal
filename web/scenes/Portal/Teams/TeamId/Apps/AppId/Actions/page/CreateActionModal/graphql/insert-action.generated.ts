/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type InsertActionMutationVariables = Types.Exact<{
  name: Types.Scalars["String"];
  description?: Types.InputMaybe<Types.Scalars["String"]>;
  action?: Types.InputMaybe<Types.Scalars["String"]>;
  app_id: Types.Scalars["String"];
  external_nullifier: Types.Scalars["String"];
  max_verifications?: Types.InputMaybe<Types.Scalars["Int"]>;
}>;

export type InsertActionMutation = {
  __typename?: "mutation_root";
  insert_action_one?: { __typename?: "action"; id: string } | null;
};

export const InsertActionDocument = gql`
  mutation InsertAction(
    $name: String!
    $description: String = ""
    $action: String = ""
    $app_id: String!
    $external_nullifier: String!
    $max_verifications: Int = 1
  ) {
    insert_action_one(
      object: {
        action: $action
        app_id: $app_id
        name: $name
        description: $description
        external_nullifier: $external_nullifier
        max_verifications: $max_verifications
      }
    ) {
      id
    }
  }
`;
export type InsertActionMutationFn = Apollo.MutationFunction<
  InsertActionMutation,
  InsertActionMutationVariables
>;

/**
 * __useInsertActionMutation__
 *
 * To run a mutation, you first call `useInsertActionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useInsertActionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [insertActionMutation, { data, loading, error }] = useInsertActionMutation({
 *   variables: {
 *      name: // value for 'name'
 *      description: // value for 'description'
 *      action: // value for 'action'
 *      app_id: // value for 'app_id'
 *      external_nullifier: // value for 'external_nullifier'
 *      max_verifications: // value for 'max_verifications'
 *   },
 * });
 */
export function useInsertActionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    InsertActionMutation,
    InsertActionMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    InsertActionMutation,
    InsertActionMutationVariables
  >(InsertActionDocument, options);
}
export type InsertActionMutationHookResult = ReturnType<
  typeof useInsertActionMutation
>;
export type InsertActionMutationResult =
  Apollo.MutationResult<InsertActionMutation>;
export type InsertActionMutationOptions = Apollo.BaseMutationOptions<
  InsertActionMutation,
  InsertActionMutationVariables
>;
