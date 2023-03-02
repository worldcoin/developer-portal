import { gql } from "@apollo/client";
import { graphQLRequest } from "src/lib/frontend-api";
import { create } from "zustand";

// Types
export type ActionType = {
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
  fetchAllActions: (app_id: string) => void;
  fetchCustomActions: (app_id: string) => void;
  fetchSignInAction: (app_id: string) => void;
};

// GraphQL queries
const selectAllActionsQuery = gql`
  query SelectAllActions($app_id: String = "") {
    action(where: { app_id: { _eq: $app_id } }) {
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

const selectCustomActionsQuery = gql`
  query SelectCustomActions($app_id: String = "") {
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

const selectSignInActionQuery = gql`
  query SelectSignInActions($app_id: String = "") {
    action(where: { app_id: { _eq: $app_id }, action: { _eq: "" } }) {
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

export const getActionStore = ({
  actions,
  currentAction,
  setActions,
  setCurrentAction,
  fetchAllActions,
  fetchCustomActions,
  fetchSignInAction,
}: ActionStore) => ({
  actions,
  currentAction,
  setActions,
  setCurrentAction,
  fetchAllActions,
  fetchCustomActions,
  fetchSignInAction,
});

export const useActionStore = create<ActionStore>((set, get) => ({
  actions: [] as ActionType[],
  currentAction: null,
  setActions: (actions: ActionType[]) => set({ actions }),
  setCurrentAction: (currentAction: ActionType) => set({ currentAction }),
  fetchAllActions: async (app_id) => {
    const response = await graphQLRequest({
      query: selectAllActionsQuery,
      variables: {
        app_id: app_id,
      },
    });

    if (response?.data?.action) {
      set({ actions: response.data.action });
    } else {
      console.error("Could not retrieve all actions");
    }
  },
  fetchCustomActions: async (app_id) => {
    const response = await graphQLRequest({
      query: selectCustomActionsQuery,
      variables: {
        app_id: app_id,
      },
    });

    console.log("response:", response);

    if (response?.data?.action) {
      set({ actions: response.data.action });
    } else {
      console.error("Could not retrieve custom actions");
    }
  },
  fetchSignInAction: async (app_id) => {
    const response = await graphQLRequest({
      query: selectSignInActionQuery,
      variables: {
        app_id: app_id,
      },
    });

    if (response?.data?.action?.length) {
      set({ currentAction: response.data.action[0] });
    } else {
      console.error("Could not retrieve sign in actions");
    }
  },
}));
