import { ActionModel } from "src/lib/models";
import { create } from "zustand";

export enum Screen {
  Waiting,
  Connected,
  AlreadyVerified,
  VerificationRejected,
  ConnectionError,
  Success,
  InvalidIdentity,
  VerificationError,
}

type _Action = Pick<ActionModel, "id" | "name">;

type KioskStore = {
  screen: Screen;
  selectedAction?: _Action;
  actions: _Action[];
  setScreen: (screen: Screen) => void;
  setSelectedAction: (selectedAction: _Action) => void;
};

export const useKioskStore = create<KioskStore>((set, get) => ({
  screen: Screen.Waiting,
  setScreen: (screen: Screen) =>
    set(() => ({
      screen,
    })),

  actions: [
    { id: "1", name: "Custom Action 01" },
    { id: "2", name: "Custom Action 02" },
    { id: "3", name: "Custom Action 03" },
  ],

  selectedAction: undefined,
  setSelectedAction: (selectedAction: _Action) =>
    set(() => ({ selectedAction })),
}));

export const getKioskStore = (store: KioskStore) => ({
  screen: store.screen,
  actions: store.actions,
  selectedAction: store.selectedAction,
  setScreen: store.setScreen,
  setSelectedAction: store.setSelectedAction,
});
