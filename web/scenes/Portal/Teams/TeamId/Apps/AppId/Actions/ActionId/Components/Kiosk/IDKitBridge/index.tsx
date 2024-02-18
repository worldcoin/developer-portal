import { KioskScreen } from "@/lib/types";
import {
  VerificationLevel,
  VerificationState,
  useWorldBridgeStore,
} from "@worldcoin/idkit-core";

import { memo, useEffect, useState } from "react";

interface IDKitBridgeProps {
  app_id: `app_${string}`;
  action: string;
  action_description: string;
  connectionTimeout: boolean;
  verificationLevel?: VerificationLevel;
  setScreen: (screen: KioskScreen) => void;
  setQrData: (qrData: string) => void;
  setProofResult: (result: any) => void;
  resetKiosk: () => void;
}

export const IDKitBridge = memo(function IDKitBridge(props: IDKitBridgeProps) {
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const {
    connectionTimeout,
    verificationLevel,
    setScreen,
    setQrData,
    setProofResult,
    resetKiosk,
  } = props;
  const {
    connectorURI,
    result,
    verificationState: idKitVerificationState,
    createClient,
    pollForUpdates,
    bridge_url,
  } = useWorldBridgeStore();

  useEffect(() => {
    if (idKitVerificationState !== VerificationState.PreparingClient) {
      return;
    }

    createClient({
      app_id: props.app_id,
      action: props.action,
      bridge_url,
      verification_level: verificationLevel ?? VerificationLevel.Device,
      action_description: props.action_description,
    })
      .then(() => {
        const intervalId = setInterval(
          () =>
            pollForUpdates().catch((error) => {
              setIntervalId(null);
              clearInterval(intervalId);
            }),
          3000,
        );

        setIntervalId(intervalId);
      })
      .catch((error) => {
        if (process.env.NODE_ENV === "development") {
          console.error(error);
        }
      });
  }, [
    bridge_url,
    createClient,
    idKitVerificationState,
    pollForUpdates,
    props.action,
    props.action_description,
    props.app_id,
    verificationLevel,
  ]);

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

        break;

      case VerificationState.Failed:
        if (intervalId) {
          clearInterval(intervalId);
        }
        // Prevent connection failure
        if (connectionTimeout) {
          resetKiosk();
        }
        break;
    }
  }, [
    connectionTimeout,
    idKitVerificationState,
    intervalId,
    resetKiosk,
    setScreen,
  ]);

  useEffect(() => {
    if (connectorURI) {
      setQrData(connectorURI);
    }
  }, [connectorURI, setQrData]);

  useEffect(() => {
    if (result) {
      setProofResult(result);
    }
  }, [result, setProofResult]);

  return <></>;
});