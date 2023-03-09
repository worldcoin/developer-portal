import { ActionModelWithNullifiers } from "src/lib/models";
import { create } from "zustand";

type NewAction = {
  name: string;
  description: string;
  action: string;
  app_id: string;
};

export type IActionStore = {
  actions: Array<ActionModelWithNullifiers>;
  setActions: (actions: Array<ActionModelWithNullifiers>) => void;
  newIsOpened: boolean;
  setNewIsOpened: (value: boolean) => void;
  newAction: NewAction;
  setNewAction: (value: Partial<NewAction>) => void;
};

export const useActionStore = create<IActionStore>((set, get) => ({
  actions: [] as ActionModelWithNullifiers[],
  setActions: (actions) => set(() => ({ actions })),
  // TODO: Extend with immer (reducer equivalent) to extract sign in with world id action

  newIsOpened: false,
  setNewIsOpened: (value) => set({ newIsOpened: value }),

  newAction: { name: "", description: "", action: "", app_id: "" },
  setNewAction: (value) => set({ newAction: { ...get().newAction, ...value } }),
}));
