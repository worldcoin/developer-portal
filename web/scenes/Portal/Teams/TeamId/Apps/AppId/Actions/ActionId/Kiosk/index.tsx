"use client";
import { Button } from "@/components/Button";
import { ArrowRightIcon } from "@/components/Icons/ArrowRightIcon";
import { WorldcoinTextLogo } from "@/components/Icons/WorldcoinTextLogo";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { restAPIRequest } from "@/lib/frontend-api";
import { ISuccessResult, useWorldBridgeStore } from "@worldcoin/idkit-core";
import clsx from "clsx";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { Connected } from "../Settings/TryAction/MiniKiosk/Connected";
import { IDKitBridge } from "../Settings/TryAction/MiniKiosk/IDKitBridge";
import { KioskError } from "../Settings/TryAction/MiniKiosk/KioskError";
import { Success } from "../Settings/TryAction/MiniKiosk/Success";
import { Waiting } from "../Settings/TryAction/MiniKiosk/Waiting";
import { useGetKioskActionQuery } from "./graphql/client/get-kiosk-action.generated";

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

type ActionIdKioskPageProps = {
  params: Record<string, string> | null | undefined;
  searchParams: Record<string, string> | null | undefined;
};
export const ActionIdKioskPage = (props: ActionIdKioskPageProps) => {
  const [screen, setScreen] = useState<KioskScreen>(KioskScreen.Waiting);
  const [qrData, setQrData] = useState<string | null>(null);
  const [proofResult, setProofResult] = useState<ISuccessResult | null>(null);
  const [connectionTimeout, setConnectionTimeout] = useState<boolean>(true);
  const { reset } = useWorldBridgeStore();
  const appId = props.params?.appId as `app_${string}`;
  const actionId = props.params?.actionId;
  const teamId = props.params?.teamId;

  const { data, loading } = useGetKioskActionQuery({
    variables: { action_id: actionId ?? "", app_id: appId },
    context: { headers: { team_id: teamId } },
  });

  const action = data?.action[0];
  const logo = data?.app_metadata[0]?.logo_img_url;

  const resetKiosk = useCallback(() => {
    setScreen(KioskScreen.Waiting);
    reset();
    setQrData(null);
    setProofResult(null);
    setConnectionTimeout(true);
  }, [reset]);

  // Reset kiosk if the action changes
  useEffect(() => {
    if (!action) {
      setScreen(KioskScreen.InvalidRequest);
    }
    resetKiosk();
  }, [action, resetKiosk, setScreen]);

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
    [action?.action, appId],
  );

  useEffect(() => {
    if (proofResult) {
      verifyProof(proofResult);
      setProofResult(null);
    }
  }, [proofResult, verifyProof]);

  return (
    <div className={clsx("fixed inset-0 grid w-full justify-center bg-white")}>
      <div className="grid h-[100dvh] w-[100dvw] grid-rows-auto/1fr">
        <header className="relative flex h-[80px] shrink-0 items-center justify-center">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4">
            <Button
              className="flex size-9 items-center justify-center rounded-full bg-[#ebecef]"
              href="."
            >
              {/* FIXME: Add default logo */}
              <ArrowRightIcon className="size-6 rotate-180" />
            </Button>
          </div>

          <div className="flex items-center justify-center">
            <WorldcoinTextLogo className="h-6" />
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center gap-x-4 pr-6">
            <div className="font-rubik text-14 font-medium">{action?.name}</div>
            {logo && (
              <Image
                src={logo}
                alt="logo"
                width={200}
                height={200}
                className="size-11 rounded-full"
              />
            )}
          </div>
        </header>
        {loading ? ( // TODO
          <div className="flex w-full items-center justify-center">
            <Skeleton count={4} className="w-full max-w-[500px]" />
          </div>
        ) : (
          <div
            className={clsx(
              "grid h-full items-center border border-grey-100 bg-grey-50",
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
            <div className="grid w-full items-center justify-items-center gap-y-5">
              <Typography variant={TYPOGRAPHY.H4} className="text-center">
                World ID Kiosk Verification
              </Typography>
              {action?.description && (
                <Typography variant={TYPOGRAPHY.R3} className="text-center">
                  {action.description}
                </Typography>
              )}
            </div>
            <div className="grid h-full items-start justify-center">
              {!action && (
                <KioskError
                  title="This request is invalid."
                  reset={resetKiosk}
                />
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
                <Waiting
                  qrData={qrData}
                  showSimulator={false}
                  qrCodeSize={300}
                />
              )}
              {screen === KioskScreen.Connected && (
                <Connected reset={resetKiosk} />
              )}
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
        )}
      </div>
    </div>
  );
};
