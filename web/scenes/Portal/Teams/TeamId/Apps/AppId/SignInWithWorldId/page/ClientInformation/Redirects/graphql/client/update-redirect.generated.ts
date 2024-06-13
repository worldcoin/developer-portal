/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type UpdateRedirectMutationVariables = Types.Exact<{
  id: Types.Scalars["String"];
  uri: Types.Scalars["String"];
}>;

export type UpdateRedirectMutation = {
  __typename?: "mutation_root";
  update_redirect_by_pk?: {
    __typename?: "redirect";
    id: string;
    action_id: string;
    redirect_uri: string;
    created_at: string;
    updated_at: string;
  } | null;
};

export const UpdateRedirectDocument = gql`
  mutation UpdateRedirect($id: String!, $uri: String!) {
    update_redirect_by_pk(
      pk_columns: { id: $id }
      _set: { redirect_uri: $uri }
    ) {
      id
      action_id
      redirect_uri
      created_at
      updated_at
    }
  }
`;
export type UpdateRedirectMutationFn = Apollo.MutationFunction<
  UpdateRedirectMutation,
  UpdateRedirectMutationVariables
>;

/**
 * __useUpdateRedirectMutation__
 *
 * To run a mutation, you first call `useUpdateRedirectMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateRedirectMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateRedirectMutation, { data, loading, error }] = useUpdateRedirectMutation({
 *   variables: {
 *      id: // value for 'id'
 *      uri: // value for 'uri'
 *   },
 * });
 */
export function useUpdateRedirectMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateRedirectMutation,
    UpdateRedirectMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateRedirectMutation,
    UpdateRedirectMutationVariables
  >(UpdateRedirectDocument, options);
}
export type UpdateRedirectMutationHookResult = ReturnType<
  typeof useUpdateRedirectMutation
>;
export type UpdateRedirectMutationResult =
  Apollo.MutationResult<UpdateRedirectMutation>;
export type UpdateRedirectMutationOptions = Apollo.BaseMutationOptions<
  UpdateRedirectMutation,
  UpdateRedirectMutationVariables
>;
