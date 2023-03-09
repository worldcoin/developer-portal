import { ActionModelWithNullifiers } from "src/lib/models";
import { create } from "zustand";

export type IActionStore = {
  actions: Array<ActionModelWithNullifiers>;
  setActions: (actions: Array<ActionModelWithNullifiers>) => void;
};

export const useActionStore = create<IActionStore>((set, get) => ({
  actions: [] as ActionModelWithNullifiers[],
  setActions: (actions) => set(() => ({ actions })),
  // TODO: Extend with immer (reducer equivalent) to extract sign in with world id action
}));
