import dayjs from "dayjs";
import { ActionKioskType } from "src/lib/types";
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
  InvalidRequest,
}

interface ISuccessResult {
  timestamp: dayjs.Dayjs;
  confirmationCode: string;
}

export type IKioskStore = {
  kioskAction: ActionKioskType | null;
  screen: KioskScreen;
  verificationState: string | null;
  qrData: { mobile: string; default: string } | null;
  resetWC: (() => void) | null; // Resets the WalletConnect session
  successResult: ISuccessResult | null;

  setScreen: (screen: KioskScreen) => void;
  setQrData: (qrData: { mobile: string; default: string }) => void;
  setKioskAction: (kioskAction: ActionKioskType) => void;
  setVerificationState: (verificationState: string) => void; // TODO: Fix typing of verificationState, should be VerificationState from IDKit
  setWCReset: (fn: () => void) => void;
  setSuccessResult: (result: ISuccessResult) => void;
};

export const useKioskStore = create<IKioskStore>((set, get) => ({
  kioskAction: null,
  screen: KioskScreen.Waiting,
  verificationState: null,
  qrData: null,
  resetWC: null,
  successResult: null,
  setScreen: (screen: KioskScreen) => {
    if (screen !== get().screen && screen === KioskScreen.Waiting) {
      // Reset WC when going back to the initial screen (e.g. after an error or a success)
      get().resetWC?.();
      set({ successResult: null });
    }
    set({ screen });
  },
  setQrData: (qrData: { mobile: string; default: string }) => set({ qrData }),
  setKioskAction: (kioskAction: ActionKioskType) => set({ kioskAction }),
  setVerificationState: (verificationState: string) =>
    set({ verificationState }),
  setWCReset: (fn: () => void) => set({ resetWC: fn }),
  setSuccessResult: (result: ISuccessResult) => set({ successResult: result }),
}));
