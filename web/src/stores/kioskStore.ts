import { ISuccessResult } from "@worldcoin/idkit";
import dayjs from "dayjs";
import { ActionKioskType } from "src/lib/types";
import { create } from "zustand";
import { VerificationState } from "@worldcoin/idkit/build/src/types/app";

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

interface ISuccessParams {
  timestamp: dayjs.Dayjs;
  confirmationCode: string;
}

export type IKioskStore = {
  kioskAction: ActionKioskType | null;
  screen: KioskScreen;
  verificationState: VerificationState | null;
  qrData: { mobile: string; default: string } | null;
  resetWC: (() => void) | null; // Resets the WalletConnect session
  successParams: ISuccessParams | null; // Success result from /verify endpoint
  proofResult: ISuccessResult | null; // Proof result from IDKit

  setScreen: (screen: KioskScreen) => void;
  setQrData: (qrData: { mobile: string; default: string }) => void;
  setKioskAction: (kioskAction: ActionKioskType) => void;
  setVerificationState: (verificationState: VerificationState) => void; // FIXME ASAP: Fix typing of verificationState, should be VerificationState from IDKit
  setWCReset: (fn: () => void) => void;
  setSuccessParams: (successParams: ISuccessParams) => void;
  setProofResult: (proofResult: ISuccessResult) => void;
};

export const useKioskStore = create<IKioskStore>((set, get) => ({
  kioskAction: null,
  screen: KioskScreen.Waiting,
  verificationState: null,
  qrData: null,
  resetWC: null,
  successParams: null,
  proofResult: null,
  setScreen: (screen: KioskScreen) => {
    if (screen !== get().screen && screen === KioskScreen.Waiting) {
      // Reset WC when going back to the initial screen (e.g. after an error or a success)
      get().resetWC?.();
      set({ successParams: null });
      set({ proofResult: null });
    }
    set({ screen });
  },
  setQrData: (qrData: { mobile: string; default: string }) => set({ qrData }),
  setKioskAction: (kioskAction: ActionKioskType) => set({ kioskAction }),
  setVerificationState: (verificationState: VerificationState) =>
    set({ verificationState }),
  setWCReset: (fn: () => void) => set({ resetWC: fn }),
  setSuccessParams: (successParams: ISuccessParams) => set({ successParams }),
  setProofResult: (proofResult: ISuccessResult) => set({ proofResult }),
}));
