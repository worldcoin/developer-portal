import {
  CustomAction,
  customActions,
  SignInAction,
  signInActions,
} from "common/Layout/temp-data";
import { create } from "zustand";

type States = {
  actions: Array<CustomAction>;
};

type Actions = {
  setActions: (actions: Array<CustomAction>) => void;
  fetchActions: (app_id: string) => Promise<void>;
};

export const useActionStore = create<States & Actions>((set) => ({
  actions: [],
  setActions: (actions: Array<CustomAction>) => set(() => ({ actions })),

  fetchActions: async (app_id: string) => {
    const actions = customActions[app_id];
    set(() => ({ actions }));
  },
}));
