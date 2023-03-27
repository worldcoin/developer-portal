import { CredentialType, internal as IDKitInternal } from "@worldcoin/idkit";
import { memo, useEffect } from "react";
import { IKioskStore, KioskScreen, useKioskStore } from "src/stores/kioskStore";

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
  setProofResult: store.setProofResult,
});

export const IDKitBridge = memo(function IDKitBridge(props: IIDKitBridgeProps) {
  const {
    setScreen,
    verificationState,
    setVerificationState,
    setQrData,
    setWCReset,
    setProofResult,
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
    [CredentialType.Orb, CredentialType.Phone],
    props.action_description
  );

  // Change the shown screen based on current verificationState and errorCode
  useEffect(() => {
    if (idKitVerificationState === verificationState) return;

    switch (idKitVerificationState) {
      case IDKitInternal.VerificationState.AwaitingConnection:
        setScreen(KioskScreen.Waiting);
        break;
      case IDKitInternal.VerificationState.AwaitingVerification:
        setScreen(KioskScreen.Connected);
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
      setProofResult(result);
    }
  }, [result, setProofResult]);

  return <></>;
});
