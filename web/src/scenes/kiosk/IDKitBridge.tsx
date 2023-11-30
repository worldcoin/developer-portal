import {
  useWorldBridgeStore,
  CredentialType,
  VerificationState,
} from "@worldcoin/idkit-core";

import { memo, useEffect, useState } from "react";
import { IKioskStore, KioskScreen, useKioskStore } from "src/stores/kioskStore";

interface IIDKitBridgeProps {
  app_id: string;
  action: string;
  action_description: string;
}

const getKioskStoreParams = (store: IKioskStore) => ({
  setScreen: store.setScreen,
  screen: store.screen,
  setQrData: store.setQrData,
  setWCReset: store.setWCReset,
  setProofResult: store.setProofResult,
});

export const IDKitBridge = memo(function IDKitBridge(props: IIDKitBridgeProps) {
  const [intervalId, setIntervalId] = useState<NodeJS.Timer | null>(null);
  const { setScreen, setQrData, setWCReset, setProofResult } =
    useKioskStore(getKioskStoreParams);

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
    if (idKitVerificationState !== VerificationState.PreparingClient) {
      return;
    }

    createClient(
      props.app_id,
      props.action,
      undefined,
      bridge_url,
      [CredentialType.Orb, CredentialType.Device],
      props.action_description
    )
      .then(() => {
        const intervalId = setInterval(() => {
          try {
            pollForUpdates();
          } catch (error) {
            console.error(error);
          }
        }, 2000);

        setIntervalId(intervalId);
      })
      .catch((error) => {
        if (process.env.NODE_ENV === "development") {
          console.error(error);
        }
      });
  }, [bridge_url, createClient, idKitVerificationState, pollForUpdates, props.action, props.action_description, props.app_id]);

  // Change the shown screen based on current verificationState and errorCode
  useEffect(() => {
    switch (idKitVerificationState) {
      case VerificationState.WaitingForConnection:
        setScreen(KioskScreen.Waiting);
        break;

      case VerificationState.WaitingForApp:
        setScreen(KioskScreen.Connected);
        break;

      case VerificationState.Confirmed:
        if (intervalId) {
          clearInterval(intervalId);
        }

        setScreen(KioskScreen.Success);
        break;

      case VerificationState.Failed:
        if (intervalId) {
          clearInterval(intervalId);
        }

        setScreen(KioskScreen.VerificationError);
        break;
    }
  }, [idKitVerificationState, intervalId, setScreen]);

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
