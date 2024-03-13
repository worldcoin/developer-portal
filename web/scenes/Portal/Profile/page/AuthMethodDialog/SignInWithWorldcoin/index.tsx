import { restAPIRequest } from "@/lib/frontend-api";
import { Auth0SessionUser, KioskScreen } from "@/lib/types";
import { Connected } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/Components/Kiosk/Connected";
import { IDKitBridge } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/Components/Kiosk/IDKitBridge";
import { KioskError } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/Components/Kiosk/KioskError";
import { Success } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/Components/Kiosk/Success";
import { Waiting } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/Components/Kiosk/Waiting";
import { useMeQuery } from "@/scenes/common/me-query/client";
import { FetchMeDocument } from "@/scenes/common/me-query/client/graphql/client/me-query.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import {
  ISuccessResult,
  VerificationLevel,
  useWorldBridgeStore,
} from "@worldcoin/idkit-core";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAddNullifierToUserMutation } from "./graphql/client/add-nullifier-to-user.generated";

type ProofResponse = {
  success: boolean;
  action_id?: string;
  nullifier_hash?: string;
  created_at?: string;
  code?: string;
  detail?: string;
  attribute?: string;
};

export const SignInWithWorldcoin = () => {
  const [screen, setScreen] = useState<KioskScreen>(KioskScreen.Waiting);
  const [qrData, setQrData] = useState<string | null>(null);
  const [proofResult, setProofResult] = useState<ISuccessResult | null>(null);
  const [connectionTimeout, setConnectionTimeout] = useState<boolean>(true);

  const { reset } = useWorldBridgeStore();
  const { user: auth0User } = useUser() as Auth0SessionUser;
  const { user } = useMeQuery();

  const resetFlow = useCallback(() => {
    setScreen(KioskScreen.Waiting);
    reset();
    setQrData(null);
    setProofResult(null);
    setConnectionTimeout(true);
  }, [reset]);

  // Reset kiosk if the action changes
  useEffect(() => {
    resetFlow();
  }, [resetFlow]);

  const [addNullifier] = useAddNullifierToUserMutation({
    refetchQueries: [FetchMeDocument],
  });

  const verifyProof = useCallback(
    async (result: ISuccessResult) => {
      let response;
      setConnectionTimeout(false);
      try {
        response = await restAPIRequest<ProofResponse>(
          `/verify/${process.env.NEXT_PUBLIC_AUTH_APP}`,
          {
            method: "POST",
            json: { action: "", signal: "", ...result },
          },
        );
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

        if (!user.id || !response.nullifier_hash || !auth0User?.sub) {
          throw new Error("user id or nullifier hash is missing");
        }

        try {
          await addNullifier({
            variables: {
              id: user.id,
              nullifier_hash: response.nullifier_hash,
            },
          });
        } catch (error) {
          console.error("error adding nullifier", error);
          toast.error("Error adding sign in with worldcoin auth method");
        }
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
    [addNullifier, auth0User?.sub, user.id],
  );

  useEffect(() => {
    if (proofResult) {
      verifyProof(proofResult);
      setProofResult(null);
    }
  }, [proofResult, verifyProof]);

  return (
    <div>
      <IDKitBridge
        app_id={
          (process.env.NEXT_PUBLIC_AUTH_APP as `app_${string}`) || "app_123"
        }
        action={""}
        action_description={"Add a new authentication method to your account."}
        verificationLevel={VerificationLevel.Device}
        setScreen={setScreen}
        setQrData={setQrData}
        setProofResult={setProofResult}
        resetKiosk={resetFlow}
        connectionTimeout={connectionTimeout}
      />

      {screen === KioskScreen.Waiting && (
        <Waiting qrData={qrData} showSimulator={false} qrCodeSize={180} />
      )}

      {screen === KioskScreen.Connected && <Connected reset={resetFlow} />}
      {screen === KioskScreen.Success && <Success reset={resetFlow} />}

      {screen === KioskScreen.ConnectionError && (
        <KioskError
          title="Connection Error"
          description="We cannot establish a connection to the person's World App. Please refresh and try again."
          buttonText="Retry"
          reset={resetFlow}
        />
      )}

      {screen === KioskScreen.AlreadyVerified && (
        <KioskError
          title="Already Verified"
          description="This person has already verified for this action."
          buttonText="New verification"
          reset={resetFlow}
        />
      )}

      {screen === KioskScreen.VerificationRejected && (
        <KioskError
          title="Verification Rejected"
          description="Person rejected the verification in the World App."
          buttonText="Try again"
          reset={resetFlow}
        />
      )}

      {screen === KioskScreen.InvalidIdentity && (
        <KioskError
          title="Not verified"
          description="User has not been verified by an orb. Please try again after verifying."
          buttonText="New verification"
          reset={resetFlow}
        />
      )}

      {screen === KioskScreen.VerificationError && (
        <KioskError
          title="Verification Error"
          description="We couldn't verify this person. Please try again."
          buttonText="Retry"
          reset={resetFlow}
        />
      )}
    </div>
  );
};
