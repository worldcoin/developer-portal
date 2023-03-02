import { memo, useCallback, useEffect } from "react";
import { internal as IDKitInternal, ISuccessResult } from "@worldcoin/idkit";
import { IKioskStore, KioskScreen, useKioskStore } from "src/stores/kioskStore";
import dayjs from "dayjs";

interface IIDKitBridgeProps {
  app_id: string;
  action: string;
  action_description: string;
}

const getKioskStoreParams = (store: IKioskStore) => ({
  setScreen: store.setScreen,
  setVerificationState: store.setVerificationState,
  verificationState: store.verificationState,
  screen: store.screen,
  setQrData: store.setQrData,
  setWCReset: store.setWCReset,
  setSuccessResult: store.setSuccessResult,
});

export const IDKitBridge = memo(function IDKitBridge(props: IIDKitBridgeProps) {
  const {
    setScreen,
    verificationState,
    setVerificationState,
    setQrData,
    setWCReset,
    setSuccessResult,
  } = useKioskStore(getKioskStoreParams);
  const {
    result,
    errorCode,
    verificationState: idKitVerificationState,
    qrData,
    reset,
  } = IDKitInternal.useAppConnection(
    props.app_id,
    props.action,
    undefined,
    props.action_description
  );

  // // Change the shown screen based on current verificationState and errorCode
  useEffect(() => {
    console.log("idKitVerificationState", idKitVerificationState);
    if (idKitVerificationState === verificationState) return;

    switch (idKitVerificationState) {
      case IDKitInternal.VerificationState.AwaitingConnection:
        setScreen(KioskScreen.Waiting);
        break;
      case IDKitInternal.VerificationState.AwaitingVerification:
        setScreen(KioskScreen.Connected);
        break;
      case IDKitInternal.VerificationState.Confirmed:
        setScreen(KioskScreen.Success);
        break;
      case IDKitInternal.VerificationState.Failed:
        switch (errorCode) {
          case "connection_failed":
            setScreen(KioskScreen.ConnectionError);
            break;
          case "already_signed":
            setScreen(KioskScreen.AlreadyVerified);
            break;
          case "verification_rejected":
            setScreen(KioskScreen.VerificationRejected);
            break;
          case "unexpected_response":
          case "generic_error":
          default:
            setScreen(KioskScreen.VerificationError);
        }
    }
    setVerificationState(idKitVerificationState);
  }, [verificationState, idKitVerificationState, setScreen, errorCode, setVerificationState]);

  useEffect(() => {
    if (qrData) {
      setQrData(qrData);
    }
  }, [qrData, setQrData]);

  useEffect(() => {
    setWCReset(() => {
      reset();
      console.info("Resetting connection session to World App (WC).");
    });
  }, [setWCReset, reset]);

  useEffect(() => {
    if (result) {
      setSuccessResult(result);
    }
  }, [result, setSuccessResult]);

  const verifyProof = useCallback(
    async (result: ISuccessResult) => {
      try {
        const response = await restAPIRequest<ProofResponse>(
          `/verify/${kioskAction?.app.id}`,
          {
            method: "POST",
            json: { action: kioskAction?.action, signal: "", ...result },
          }
        );

        return response;
      } catch (e) {
        console.warn("Error verifying proof. Please check network logs.");
        try {
          if ((e as Record<string, any>).code) {
            return {
              success: false,
              code: (e as Record<string, any>).code,
            };
          }
        } catch {}
        return { success: false, code: "unknown" };
      }
    },
    [kioskAction]
  );

  return <></>;
});
