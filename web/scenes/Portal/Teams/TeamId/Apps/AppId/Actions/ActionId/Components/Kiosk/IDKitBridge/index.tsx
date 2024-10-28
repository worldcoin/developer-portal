import { KioskScreen } from "@/lib/types";
import {
  VerificationLevel,
  VerificationState,
  useWorldBridgeStore,
} from "@worldcoin/idkit-core";

import { memo, useEffect, useRef } from "react";

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
  const intervalIdRef = useRef<NodeJS.Timeout | undefined>(undefined);

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

    let isSubscribed = true;

    // Check if any interval currently exists and clear it
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = undefined;
    }

    const startPolling = async () => {
      try {
        await createClient({
          app_id: props.app_id,
          action: props.action,
          bridge_url,
          verification_level: verificationLevel ?? VerificationLevel.Device,
          action_description: props.action_description,
        });

        if (isSubscribed) {
          intervalIdRef.current = setInterval(async () => {
            console.log("here");
            try {
              if (isSubscribed) {
                await pollForUpdates();
              }
            } catch (error) {
              if (intervalIdRef.current) {
                clearInterval(intervalIdRef.current);
                intervalIdRef.current = undefined;
              }
            }
          }, 3000);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.log("Error creating client");
          console.error(error);
        }
      }
    };

    startPolling();

    // Cleanup function
    return () => {
      isSubscribed = false;
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = undefined;
      }
    };
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

  useEffect(() => {
    // Change the shown screen based on current verificationState and errorCode
    switch (idKitVerificationState) {
      case VerificationState.WaitingForConnection:
        setScreen(KioskScreen.Waiting);
        break;

      case VerificationState.WaitingForApp:
        setScreen(KioskScreen.Connected);
        break;

      case VerificationState.Confirmed:
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
        }
        break;

      case VerificationState.Failed:
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
        }
        // Prevent connection failure
        if (connectionTimeout) {
          if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current);
          }
          resetKiosk();
        }
        break;
    }
  }, [connectionTimeout, idKitVerificationState, resetKiosk, setScreen]);

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
