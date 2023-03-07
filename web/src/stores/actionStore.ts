import { gql } from "@apollo/client";
import { graphQLRequest } from "src/lib/frontend-api";
import { ActionModel, NullifierModel } from "src/lib/models";
import { create } from "zustand";

export interface ActionModelWithNullifiers extends ActionModel {
  nullifiers: Array<
    Pick<NullifierModel, "id" | "nullifier_hash" | "created_at">
  >;
}

// GraphQL queries
const selectAllActionsQuery = gql`
  query SelectAllActions($app_id: String = "") {
    action(where: { app_id: { _eq: $app_id }, action: { _neq: "" } }) {
      id
      app_id
      action
      max_verifications
      max_accounts_per_user
      name
      description
      nullifiers {
        id
        nullifier_hash
        created_at
      }
    }
  }
`;

export type IActionStore = {
  actions: Array<ActionModelWithNullifiers>;

  currentAction: ActionModelWithNullifiers | null;
  setCurrentAction: (currentAction: ActionModelWithNullifiers) => void;
  fetchActions: (app_id: string) => void;
};

export const useActionStore = create<IActionStore>((set, get) => ({
  actions: [] as ActionModelWithNullifiers[],
  currentAction: null,
  setCurrentAction: (currentAction: ActionModelWithNullifiers) =>
    set({ currentAction }),
  fetchActions: async (app_id) => {
    const { data } = await graphQLRequest<{
      action: Array<ActionModelWithNullifiers>;
    }>({
      query: selectAllActionsQuery,
      variables: {
        app_id: app_id,
      },
    });
    if (data?.action) {
      set({ actions: data.action });
    } else {
      console.error("Could not retrieve actions for app.");
    }
  },
  // TODO: Extend with immer (reducer equivalent) to extract sign in with world id action
}));
