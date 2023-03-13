import { ActionModelWithNullifiers } from "src/lib/models";
import { NewAction } from "src/scenes/actions/NewAction";
import { create } from "zustand";

type NewAction = {
  name: string;
  description: string;
  action: string;
};

export type IActionStore = {
  actions: Array<ActionModelWithNullifiers>;
  setActions: (actions: Array<ActionModelWithNullifiers>) => void;
  isNewActionModalOpened: boolean;
  setIsNewActionModalOpened: (value: boolean) => void;
  newAction: NewAction;
  setNewAction: (value: Partial<NewAction>) => void;
};

export const useActionStore = create<IActionStore>((set, get) => ({
  actions: [] as ActionModelWithNullifiers[],
  setActions: (actions) => set(() => ({ actions })),
  // TODO: Extend with immer (reducer equivalent) to extract sign in with world id action

  isNewActionModalOpened: false,
  setIsNewActionModalOpened: (value) => set({ isNewActionModalOpened: value }),

  newAction: { name: "", description: "", action: "", app_id: "" },
  setNewAction: (value) =>
    set({
      newAction: {
        name: value.name ?? get().newAction.name,
        description: value.description ?? get().newAction.description,
        action: (value.action ?? get().newAction.action).replace(/[^\w-]/g, ""),
      },
    }),
}));
