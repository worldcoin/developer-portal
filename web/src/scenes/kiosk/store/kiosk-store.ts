import { create } from "zustand";
import { Action } from "../types";

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

type KioskStore = {
  screen: Screen;
  selectedAction?: Action;
  actions: Action[];
  setScreen: (screen: Screen) => void;
  setSelectedAction: (selectedAction: Action) => void;
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
  setSelectedAction: (selectedAction: Action) =>
    set(() => ({ selectedAction })),
}));

export const getKioskStore = (store: KioskStore) => ({
  screen: store.screen,
  actions: store.actions,
  selectedAction: store.selectedAction,
  setScreen: store.setScreen,
  setSelectedAction: store.setSelectedAction,
});
