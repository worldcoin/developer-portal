import { restAPIRequest } from "@/lib/frontend-api";
import { AppModel } from "src/lib/models";
import { create } from "zustand";

export enum KioskScreen {
  Waiting,
  Connected,
  AlreadyVerified,
  VerificationRejected,
  ConnectionError,
  Success,
  InvalidIdentity,
  VerificationError,
}

export type IKioskStore = {
  kioskApp: AppModel | null;
  screen: KioskScreen;
  setKioskApp: (app: AppModel) => void;
  setScreen: (screen: KioskScreen) => void;
  fetchPrecheck: (app_id: string, action: string) => void;
};

export const useKioskStore = create<IKioskStore>((set, get) => ({
  kioskApp: null,
  screen: KioskScreen.Waiting,
  setKioskApp: (kioskApp: AppModel) => set({ kioskApp }),
  setScreen: (screen: KioskScreen) => set({ screen }),
  fetchPrecheck: async (app_id: string, action: string) => {
    // FIXME: Paolo
    const response = await restAPIRequest(`/precheck/${app_id}`, {
      method: "POST",
      json: {
        action,
      },
    });

    if (response) {
      set({});
    } else {
      console.error("Could not retrieve kiosk app");
    }
  },
}));
