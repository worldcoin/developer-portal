import { internal as IDKitInternal } from "@worldcoin/idkit";
import { restAPIRequest } from "frontend-api";
import { create } from "zustand";
import { AppType } from "./app-store";

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
  kioskApp: AppType | null;
  screen: Screen;
  setKioskApp: (app: AppType) => void;
  setScreen: (screen: Screen) => void;
  fetchPrecheck: (app_id: string, action: string) => void;
};

export const getKioskStore = ({
  kioskApp: kioskApp,
  screen,
  setKioskApp: setApp,
  setScreen,
  fetchPrecheck,
}: KioskStore) => ({
  kioskApp,
  screen,
  setApp,
  setScreen,
  fetchPrecheck,
});
export const useKioskStore = create<KioskStore>((set, get) => ({
  kioskApp: null,
  screen: Screen.Waiting,
  setKioskApp: (kioskApp: AppType) => set({ kioskApp }),
  setScreen: (screen: Screen) => set({ screen }),
  fetchPrecheck: async (app_id: string, action: string) => {
    const external_nullifier = IDKitInternal.generateExternalNullifier(
      app_id,
      action
    ).digest;

    const response = await restAPIRequest(`/precheck/${app_id}`, {
      method: "POST",
      json: {
        action,
        external_nullifier,
      },
    });

    if (response) {
      set({});
    } else {
      console.error("Could not retrieve kiosk app");
    }
  },
}));
