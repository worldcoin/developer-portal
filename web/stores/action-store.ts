import { gql } from "@apollo/client";
import { graphQLRequest } from "frontend-api";
import { create } from "zustand";

// Types
type ActionType = {
  id: string;
  app_id: string;
  action: string;
  max_verifications: number;
  max_accounts_per_user: number;
  name: string;
  description: string;
  nullifiers: Array<{
    id: string;
    nullifier_hash: string;
    created_at: string;
  }>;
};

export type ActionStore = {
  actions: Array<ActionType>;
  currentAction: ActionType | null;
  setActions: (actions: Array<ActionType>) => void;
  setCurrentAction: (currentAction: ActionType) => void;
  fetchActions: () => void;
};

// GraphQL queries
const selectActionsQuery = gql`
  query SelectActions {
    action {
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

export const useActionStore = create<ActionStore>((set, get) => ({
  actions: [] as ActionType[],
  currentAction: null,
  setActions: (actions: ActionType[]) => set({ actions }),
  setCurrentAction: (currentAction: ActionType) => set({ currentAction }),
  fetchActions: async () => {
    const response = await graphQLRequest({
      query: selectActionsQuery,
    });

    if (response?.data?.action) {
      set({ actions: response.data.action });
    } else {
      console.error("Could not retrieve actions");
    }
  },
}));
