/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type ToggleKioskMutationVariables = Types.Exact<{
  id: Types.Scalars["String"];
  kiosk_status: Types.Scalars["Boolean"];
}>;

export type ToggleKioskMutation = {
  __typename?: "mutation_root";
  update_action_by_pk?: { __typename?: "action"; id: string } | null;
};

export const ToggleKioskDocument = gql`
  mutation ToggleKiosk($id: String!, $kiosk_status: Boolean!) {
    update_action_by_pk(
      pk_columns: { id: $id }
      _set: { kiosk_enabled: $kiosk_status }
    ) {
      id
    }
  }
`;
export type ToggleKioskMutationFn = Apollo.MutationFunction<
  ToggleKioskMutation,
  ToggleKioskMutationVariables
>;

/**
 * __useToggleKioskMutation__
 *
 * To run a mutation, you first call `useToggleKioskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useToggleKioskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [toggleKioskMutation, { data, loading, error }] = useToggleKioskMutation({
 *   variables: {
 *      id: // value for 'id'
 *      kiosk_status: // value for 'kiosk_status'
 *   },
 * });
 */
export function useToggleKioskMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ToggleKioskMutation,
    ToggleKioskMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<ToggleKioskMutation, ToggleKioskMutationVariables>(
    ToggleKioskDocument,
    options,
  );
}
export type ToggleKioskMutationHookResult = ReturnType<
  typeof useToggleKioskMutation
>;
export type ToggleKioskMutationResult =
  Apollo.MutationResult<ToggleKioskMutation>;
export type ToggleKioskMutationOptions = Apollo.BaseMutationOptions<
  ToggleKioskMutation,
  ToggleKioskMutationVariables
>;
