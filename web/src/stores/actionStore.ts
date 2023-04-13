import { ActionModelWithNullifiers } from "src/lib/models";
import { NewAction } from "src/scenes/actions/NewAction";
import { ActionsQuery } from "src/scenes/actions/graphql/actions.generated";
import { create } from "zustand";

type NewAction = {
  name: string;
  description: string;
  action: string;
  maxVerifications: number | null;
};

export type IActionStore = {
  actions: Array<ActionModelWithNullifiers>;
  setActions: (actions: Array<ActionModelWithNullifiers>) => void;
  isNewActionModalOpened: boolean;
  setIsNewActionModalOpened: (value: boolean) => void;
  isUpdateActionModalOpened: boolean;
  setIsUpdateActionModalOpened: (value: boolean) => void;
  actionToUpdate: ActionsQuery["action"][number] | null;
  setActionToUpdate: (value: ActionsQuery["action"][number]) => void;
  actionToDelete: ActionsQuery["action"][number] | null;
  setActionToDelete: (value: ActionsQuery["action"][number]) => void;
  isDeleteActionModalOpened: boolean;
  setIsDeleteActionModalOpened: (value: boolean) => void;
  newAction: NewAction;
  setNewAction: (value: Partial<NewAction>) => void;
};

export const useActionStore = create<IActionStore>((set, get) => ({
  actions: [] as ActionModelWithNullifiers[],
  setActions: (actions) => set(() => ({ actions })),
  // TODO: Extend with immer (reducer equivalent) to extract sign in with world id action

  isNewActionModalOpened: false,
  setIsNewActionModalOpened: (value) => set({ isNewActionModalOpened: value }),

  isUpdateActionModalOpened: false,
  setIsUpdateActionModalOpened: (value) =>
    set({ isUpdateActionModalOpened: value }),

  actionToUpdate: null,
  setActionToUpdate: (value) => set({ actionToUpdate: value }),

  actionToDelete: null,
  setActionToDelete: (value) => set({ actionToDelete: value }),

  isDeleteActionModalOpened: false,
  setIsDeleteActionModalOpened: (value) =>
    set({ isDeleteActionModalOpened: value }),

  newAction: { name: "", description: "", action: "", maxVerifications: null },
  setNewAction: (value) =>
    set({
      newAction: {
        name: value.name ?? get().newAction.name,
        description: value.description ?? get().newAction.description,
        action: (value.action ?? get().newAction.action).replace(/[^\w-]/g, ""),
        maxVerifications:
          value.maxVerifications ?? get().newAction.maxVerifications,
      },
    }),
}));
