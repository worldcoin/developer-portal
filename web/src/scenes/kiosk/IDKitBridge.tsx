import {
  useWorldBridgeStore,
  CredentialType,
  VerificationState,
} from "@worldcoin/idkit-core";

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
    connectorURI,
    result,
    errorCode,
    verificationState: idKitVerificationState,
    createClient,
    pollForUpdates,
    bridge_url,
    reset,
  } = useWorldBridgeStore();

  useEffect(() => {
    createClient(
      props.app_id,
      props.action,
      undefined,
      bridge_url,
      [CredentialType.Orb, CredentialType.Device],
      props.action_description
    )
      .then((data) => {
        pollForUpdates();
      })
      .catch((error) => console.log({ error }));
  }, [bridge_url, createClient, pollForUpdates, props.action, props.action_description, props.app_id]);

  // Change the shown screen based on current verificationState and errorCode
  useEffect(() => {
    if (idKitVerificationState === verificationState) return;

    switch (idKitVerificationState) {
      case VerificationState.WaitingForConnection:
        setScreen(KioskScreen.Waiting);
        break;
      case VerificationState.WaitingForApp:
        setScreen(KioskScreen.Connected);
        break;
      case VerificationState.Failed:
        switch (errorCode) {
          case "connection_failed":
            setScreen(KioskScreen.ConnectionError);
            break;
          // REVIEW: We don't have this type in new version of VerificationState
          // case "already_signed":
          //   setScreen(KioskScreen.AlreadyVerified);
          //   break;
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
    if (connectorURI) {
      setQrData(connectorURI);
    }
  }, [connectorURI, setQrData]);

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
