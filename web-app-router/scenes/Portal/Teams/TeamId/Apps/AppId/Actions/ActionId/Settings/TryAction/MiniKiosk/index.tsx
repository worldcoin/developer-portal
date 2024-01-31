import { ISuccessResult, useWorldBridgeStore } from "@worldcoin/idkit-core";
import { useCallback, useEffect, useState } from "react";
import { Connected } from "./Connected";
import { IDKitBridge } from "./IDKitBridge";
import { KioskError } from "./KioskError";
import { Success } from "./Success";
import { Waiting } from "./Waiting";
import { restAPIRequest } from "@/lib/frontend-api";
import clsx from "clsx";

type ProofResponse = {
  success: boolean;
  action_id?: string;
  nullifier_hash?: string;
  created_at?: string;
  code?: string;
  detail?: string;
  attribute?: string;
};

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

type MiniKioskProps = {
  action: {
    name: string;
    description: string;
    action: string;
    app_id: string;
    app: { is_staging: boolean };
  };
};
export const MiniKiosk = (props: MiniKioskProps) => {
  const [screen, setScreen] = useState<KioskScreen>(KioskScreen.Waiting);
  const [qrData, setQrData] = useState<string | null>(null);
  const [proofResult, setProofResult] = useState<ISuccessResult | null>(null);
  const [connectionTimeout, setConnectionTimeout] = useState<boolean>(true);
  const { reset } = useWorldBridgeStore();
  const { action } = props;
  const appId = action.app_id as `app_${string}`;

  const resetKiosk = useCallback(() => {
    setScreen(KioskScreen.Waiting);
    reset();
    setQrData(null);
    setProofResult(null);
    setConnectionTimeout(true);
  }, [reset]);

  useEffect(() => {
    if (!action) {
      setScreen(KioskScreen.InvalidRequest);
    }
  }, [action, setScreen]);

  const verifyProof = useCallback(
    async (result: ISuccessResult) => {
      let response;
      setConnectionTimeout(false);
      try {
        response = await restAPIRequest<ProofResponse>(`/verify/${appId}`, {
          method: "POST",
          json: { action: action?.action, signal: "", ...result },
        });
      } catch (e) {
        console.warn("Error verifying proof. Please check network logs.");
        try {
          if ((e as Record<string, any>).code) {
            response = {
              success: false,
              code: (e as Record<string, any>).code,
            };
          }
        } catch {
          response = { success: false, code: "unknown" };
        }
      }
      if (response?.success) {
        setScreen(KioskScreen.Success);
      } else {
        if (response?.code === "max_verifications_reached") {
          setScreen(KioskScreen.AlreadyVerified);
        } else if (response?.code === "invalid_merkle_root") {
          setScreen(KioskScreen.InvalidIdentity);
        } else {
          setScreen(KioskScreen.VerificationError);
        }
      }
    },
    [setScreen]
  );

  useEffect(() => {
    if (proofResult) {
      verifyProof(proofResult);
      setProofResult(null);
    }
  }, [proofResult, verifyProof]);

  return (
    <div
      className={clsx(
        "bg-grey-50 border border-grey-100 rounded-3xl h-full items-center grid",
        {
          "bg-system-success-50": screen === KioskScreen.Success,
          "bg-system-error-50":
            screen === KioskScreen.ConnectionError ||
            screen === KioskScreen.VerificationError ||
            screen === KioskScreen.InvalidRequest ||
            screen === KioskScreen.InvalidIdentity ||
            screen === KioskScreen.AlreadyVerified,
        }
      )}
    >
      <div className="grow grid grid-rows-auto/1fr/auto items-center justify-center">
        {!action && (
          <KioskError title="This request is invalid." reset={resetKiosk} />
        )}

        {action && (
          <IDKitBridge
            app_id={appId}
            action={action.action}
            action_description={action.description}
            setScreen={setScreen}
            setQrData={setQrData}
            setProofResult={setProofResult}
            resetKiosk={resetKiosk}
            connectionTimeout={connectionTimeout}
          />
        )}

        {screen === KioskScreen.Waiting && (
          <Waiting qrData={qrData} showSimulator={action.app.is_staging} />
        )}
        {screen === KioskScreen.Connected && <Connected reset={resetKiosk} />}
        {screen === KioskScreen.Success && <Success reset={resetKiosk} />}

        {screen === KioskScreen.ConnectionError && (
          <KioskError
            title="Connection Error"
            description="We cannot establish a connection to the person's World App. Please refresh and try again."
            buttonText="Retry"
            reset={resetKiosk}
          />
        )}

        {screen === KioskScreen.AlreadyVerified && (
          <KioskError
            title="Already Verified"
            description="This person has already verified for this action."
            buttonText="New verification"
            reset={resetKiosk}
          />
        )}

        {screen === KioskScreen.VerificationRejected && (
          <KioskError
            title="Verification Rejected"
            description="Person rejected the verification in the World App."
            buttonText="Try again"
            reset={resetKiosk}
          />
        )}

        {screen === KioskScreen.InvalidIdentity && (
          <KioskError
            title="Not verified"
            description="Person is not verified with World ID. They can visit an orb to verify."
            buttonText="New verification"
            reset={resetKiosk}
          />
        )}

        {screen === KioskScreen.VerificationError && (
          <KioskError
            title="Verification Error"
            description="We couldn't verify this person. Please try again."
            buttonText="Retry"
            reset={resetKiosk}
          />
        )}
      </div>
    </div>
  );
};
