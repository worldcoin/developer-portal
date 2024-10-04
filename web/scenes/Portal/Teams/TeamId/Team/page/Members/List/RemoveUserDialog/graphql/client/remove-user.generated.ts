/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type RemoveUserMutationVariables = Types.Exact<{
  userId: Types.Scalars["String"]["input"];
  teamId: Types.Scalars["String"]["input"];
}>;

export type RemoveUserMutation = {
  __typename?: "mutation_root";
  delete_membership?: {
    __typename?: "membership_mutation_response";
    affected_rows: number;
  } | null;
};

export const RemoveUserDocument = gql`
  mutation RemoveUser($userId: String!, $teamId: String!) {
    delete_membership(
      where: {
        _and: [{ user_id: { _eq: $userId } }, { team_id: { _eq: $teamId } }]
      }
    ) {
      affected_rows
    }
  }
`;
export type RemoveUserMutationFn = Apollo.MutationFunction<
  RemoveUserMutation,
  RemoveUserMutationVariables
>;

/**
 * __useRemoveUserMutation__
 *
 * To run a mutation, you first call `useRemoveUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeUserMutation, { data, loading, error }] = useRemoveUserMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *      teamId: // value for 'teamId'
 *   },
 * });
 */
export function useRemoveUserMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RemoveUserMutation,
    RemoveUserMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<RemoveUserMutation, RemoveUserMutationVariables>(
    RemoveUserDocument,
    options,
  );
}
export type RemoveUserMutationHookResult = ReturnType<
  typeof useRemoveUserMutation
>;
export type RemoveUserMutationResult =
  Apollo.MutationResult<RemoveUserMutation>;
export type RemoveUserMutationOptions = Apollo.BaseMutationOptions<
  RemoveUserMutation,
  RemoveUserMutationVariables
>;
