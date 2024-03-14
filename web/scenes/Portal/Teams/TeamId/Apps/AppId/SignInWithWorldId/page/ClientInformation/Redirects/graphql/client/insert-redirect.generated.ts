/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type InsertRedirectMutationVariables = Types.Exact<{
  action_id: Types.Scalars["String"];
  uri: Types.Scalars["String"];
}>;

export type InsertRedirectMutation = {
  __typename?: "mutation_root";
  insert_redirect_one?: {
    __typename?: "redirect";
    id: string;
    action_id: string;
    redirect_uri: string;
    created_at: any;
    updated_at: any;
  } | null;
};

export const InsertRedirectDocument = gql`
  mutation InsertRedirect($action_id: String!, $uri: String!) {
    insert_redirect_one(object: { action_id: $action_id, redirect_uri: $uri }) {
      id
      action_id
      redirect_uri
      created_at
      updated_at
    }
  }
`;
export type InsertRedirectMutationFn = Apollo.MutationFunction<
  InsertRedirectMutation,
  InsertRedirectMutationVariables
>;

/**
 * __useInsertRedirectMutation__
 *
 * To run a mutation, you first call `useInsertRedirectMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useInsertRedirectMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [insertRedirectMutation, { data, loading, error }] = useInsertRedirectMutation({
 *   variables: {
 *      action_id: // value for 'action_id'
 *      uri: // value for 'uri'
 *   },
 * });
 */
export function useInsertRedirectMutation(
  baseOptions?: Apollo.MutationHookOptions<
    InsertRedirectMutation,
    InsertRedirectMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    InsertRedirectMutation,
    InsertRedirectMutationVariables
  >(InsertRedirectDocument, options);
}
export type InsertRedirectMutationHookResult = ReturnType<
  typeof useInsertRedirectMutation
>;
export type InsertRedirectMutationResult =
  Apollo.MutationResult<InsertRedirectMutation>;
export type InsertRedirectMutationOptions = Apollo.BaseMutationOptions<
  InsertRedirectMutation,
  InsertRedirectMutationVariables
>;

