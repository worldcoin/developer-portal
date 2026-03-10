import { LegacyVerificationLevel } from "@/lib/idkit";
import { KioskScreen } from "@/lib/types";
import type { IDKitResult } from "@worldcoin/idkit";
import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";
import { Connected } from "../../../Components/Kiosk/Connected";
import { KioskError } from "../../../Components/Kiosk/KioskError";
import { Success } from "../../../Components/Kiosk/Success";
import { Waiting } from "../../../Components/Kiosk/Waiting";
import {
  submitKioskProof,
  useLegacyKioskRequest,
  type KioskProofResponse,
} from "../../../Components/Kiosk/useLegacyKioskRequest";

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
  const [kioskVerificationLevel, setKioskVerificationLevel] =
    useState<LegacyVerificationLevel>(LegacyVerificationLevel.Device);

  const { action } = props;
  const appId = action.app_id as `app_${string}`;
  const { connectorURI, proofResult, requestScreen, restartRequest } =
    useLegacyKioskRequest({
      appId,
      action: action.action,
      actionDescription: action.description,
      verificationLevel: kioskVerificationLevel,
      enabled: Boolean(action),
    });

  const resetKiosk = useCallback(() => {
    setScreen(KioskScreen.Waiting);
    restartRequest();
  }, [restartRequest]);

  const resetKioskAndUpdateVerificationLevel = useCallback(
    (newVerificationLevel: LegacyVerificationLevel) => {
      setKioskVerificationLevel(newVerificationLevel);
      setScreen(KioskScreen.Waiting);
      restartRequest();
    },
    [restartRequest],
  );

  // Reset kiosk if the action changes
  useEffect(() => {
    if (!action) {
      setScreen(KioskScreen.InvalidRequest);
    }
  }, [action, setScreen]);

  useEffect(() => {
    if (action) {
      setScreen(requestScreen);
    }
  }, [action, requestScreen]);

  const verifyProof = useCallback(
    async (result: IDKitResult) => {
      if (!result) {
        return;
      }

      let response: KioskProofResponse = {
        success: false,
        code: "unknown",
      };
      try {
        response = await submitKioskProof(appId, result);
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

      if (response.success) {
        setScreen(KioskScreen.Success);
      } else {
        if (response.code === "max_verifications_reached") {
          setScreen(KioskScreen.AlreadyVerified);
        } else if (response.code === "invalid_merkle_root") {
          setScreen(KioskScreen.InvalidIdentity);
        } else {
          setScreen(KioskScreen.VerificationError);
        }
      }
    },
    [appId],
  );

  useEffect(() => {
    if (proofResult) {
      void verifyProof(proofResult);
    }
  }, [proofResult, verifyProof]);

  return (
    <div
      className={clsx(
        "grid h-full items-center rounded-3xl border border-grey-100 bg-grey-50",
        {
          "bg-system-success-50": screen === KioskScreen.Success,
          "bg-system-error-50":
            screen === KioskScreen.ConnectionError ||
            screen === KioskScreen.VerificationError ||
            screen === KioskScreen.InvalidRequest ||
            screen === KioskScreen.InvalidIdentity ||
            screen === KioskScreen.AlreadyVerified,
        },
      )}
    >
      <div className="grid grow grid-rows-auto/1fr/auto items-center justify-center">
        {!action && (
          <KioskError title="This request is invalid." reset={resetKiosk} />
        )}

        {screen === KioskScreen.Waiting && (
          <Waiting
            qrData={connectorURI}
            verificationLevel={kioskVerificationLevel}
            resetKioskAndUpdateVerificationLevel={
              resetKioskAndUpdateVerificationLevel
            }
            showSimulator={action.app.is_staging}
            qrCodeSize={180}
          />
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
            description="User has not been verified by an orb. Please try again after verifying."
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
