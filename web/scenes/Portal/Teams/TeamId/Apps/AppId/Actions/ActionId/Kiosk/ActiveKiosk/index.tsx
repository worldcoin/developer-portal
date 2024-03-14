"use client";
import { Button } from "@/components/Button";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownItems,
} from "@/components/Dropdown";
import { ArrowRightIcon } from "@/components/Icons/ArrowRightIcon";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { CheckIcon } from "@/components/Icons/CheckIcon";
import { WorldcoinTextLogo } from "@/components/Icons/WorldcoinTextLogo";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { restAPIRequest } from "@/lib/frontend-api";
import { KioskScreen } from "@/lib/types";
import { getCDNImageUrl } from "@/lib/utils";
import {
  ISuccessResult,
  VerificationLevel,
  useWorldBridgeStore,
} from "@worldcoin/idkit-core";
import clsx from "clsx";
import dayjs from "dayjs";
import dayjsRelative from "dayjs/plugin/relativeTime";
import posthog from "posthog-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { Connected } from "../../Components/Kiosk/Connected";
import { IDKitBridge } from "../../Components/Kiosk/IDKitBridge";
import { KioskError } from "../../Components/Kiosk/KioskError";
import { Success } from "../../Components/Kiosk/Success";
import { Waiting } from "../../Components/Kiosk/Waiting";
import { GetKioskActionQuery } from "../graphql/client/get-kiosk-action.generated";
dayjs.extend(dayjsRelative);

type ProofResponse = {
  success: boolean;
  action_id?: string;
  nullifier_hash?: string;
  created_at?: string;
  code?: string;
  detail?: string;
  attribute?: string;
};

interface SuccessParams {
  timestamp: dayjs.Dayjs; // Assuming timestamp is a Dayjs object based on your usage
  confirmationCode: string;
}

type ActiveKioskPageProps = {
  params: Record<string, string> | null | undefined;
  data: GetKioskActionQuery;
  toggleKiosk: (value: boolean) => void;
  verificationLevel?: VerificationLevel;
};
export const ActiveKioskPage = (props: ActiveKioskPageProps) => {
  const [screen, setScreen] = useState<KioskScreen>(KioskScreen.Waiting);
  const [qrData, setQrData] = useState<string | null>(null);
  const [resetInterval, setResetInterval] = useState<number>(0);
  const [successParams, setSuccessParams] = useState<SuccessParams | null>(
    null,
  );
  const [proofResult, setProofResult] = useState<ISuccessResult | null>(null);
  const [connectionTimeout, setConnectionTimeout] = useState<boolean>(true);
  const { reset } = useWorldBridgeStore();
  const appId = props.params?.appId as `app_${string}`;
  const data = props.data;

  const action = data?.action[0];
  const logo = data?.app_metadata[0]?.logo_img_url;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetKiosk = useCallback(() => {
    setScreen(KioskScreen.Waiting);
    reset();
    setQrData(null);
    setProofResult(null);
    setConnectionTimeout(true);

    // Clear the timer when resetKiosk is called manually
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [reset]);

  useEffect(() => {
    if (screen === KioskScreen.Success && resetInterval > 0) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      if (resetInterval === 0) {
        return;
      }

      timerRef.current = setTimeout(() => {
        resetKiosk();
      }, resetInterval);
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [screen, resetInterval, resetKiosk]);

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
        posthog.capture("kiosk-verification-success", {
          action: action?.action,
          app_id: appId,
        });
        setScreen(KioskScreen.Success);
        setSuccessParams({
          timestamp: dayjs(response.created_at),
          confirmationCode:
            response.nullifier_hash?.slice(-5).toLocaleUpperCase() ?? "",
        });
      } else {
        posthog.capture("kiosk-verification-failed", {
          action: action?.action,
          app_id: appId,
          code: response?.code,
        });
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
      <div className="grid h-[100dvh] w-[100dvw] grid-rows-auto/1fr overflow-auto">
        <header className="relative flex min-h-[80px] items-center justify-between">
          <div className="left-0 flex w-1/3 items-center pl-4">
            <Button
              className="flex size-9 items-center justify-center rounded-full bg-[#ebecef]"
              onClick={() => props.toggleKiosk(false)}
              type="button"
            >
              <ArrowRightIcon className="size-6 rotate-180" />
            </Button>
          </div>

          <div className="flex w-1/3 items-center justify-center">
            <WorldcoinTextLogo className="h-6" />
          </div>

          <div className="z-[100] flex w-1/3 flex-col items-center justify-end md:flex-row md:gap-x-4 md:pr-6">
            <Dropdown>
              <DropdownButton className="grid grid-cols-1fr/auto px-3 font-rubik text-xs font-medium md:text-sm">
                Reset Interval
                <CaretIcon className="ml-1" />
              </DropdownButton>
              <DropdownItems className="mt-2 grid justify-start">
                <Typography
                  variant={TYPOGRAPHY.R3}
                  className="border-b border-grey-100 p-3 text-start"
                >
                  Choose a time interval
                </Typography>
                <DropdownItem
                  className="grid w-full grid-cols-1fr/auto  items-center px-3 py-1 hover:bg-grey-50"
                  onClick={() => setResetInterval(30000)}
                >
                  <div>
                    <Typography variant={TYPOGRAPHY.R3} className="text-start">
                      30 seconds
                    </Typography>
                    {resetInterval === 30000 && (
                      <CheckIcon size="16" className="ml-2 size-3" />
                    )}
                  </div>
                </DropdownItem>
                <DropdownItem
                  className="grid w-full grid-cols-1fr/auto  items-center px-3 py-1 hover:bg-grey-50"
                  onClick={() => setResetInterval(60000)}
                >
                  <div>
                    <Typography variant={TYPOGRAPHY.R3}>1 minute</Typography>
                    {resetInterval === 60000 && (
                      <CheckIcon size="16" className="ml-2 size-3" />
                    )}
                  </div>
                </DropdownItem>
                <DropdownItem
                  className="grid w-full grid-cols-1fr/auto  items-center px-3 py-1 hover:bg-grey-50"
                  onClick={() => setResetInterval(300000)}
                >
                  <div>
                    <Typography variant={TYPOGRAPHY.R3}>5 minutes</Typography>
                    {resetInterval === 300000 && (
                      <CheckIcon size="16" className="ml-2 size-3" />
                    )}
                  </div>
                </DropdownItem>
                <DropdownItem
                  className="grid w-full grid-cols-1fr/auto items-center px-3 py-1 hover:bg-grey-50"
                  onClick={() => setResetInterval(0)}
                >
                  <div>
                    <Typography variant={TYPOGRAPHY.R3}>Never</Typography>
                    {resetInterval === 0 && (
                      <CheckIcon size="16" className="ml-2 size-3" />
                    )}
                  </div>
                </DropdownItem>
              </DropdownItems>
            </Dropdown>
            {logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getCDNImageUrl(appId, logo) ?? ""}
                alt="logo"
                width={200}
                height={200}
                className="size-8 rounded-full"
              />
            )}
            <Typography
              variant={TYPOGRAPHY.R4}
              className="max-w-[100px] truncate"
            >
              {action?.name}
            </Typography>
          </div>
        </header>

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
            <Typography variant={TYPOGRAPHY.H4} className="pt-5 text-center">
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
                verificationLevel={props.verificationLevel}
              />
            )}

            {screen === KioskScreen.Waiting && (
              <Waiting qrData={qrData} showSimulator={false} qrCodeSize={280} />
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
            {screen === KioskScreen.Success && successParams && (
              <div className="grid grid-cols-1">
                <Typography variant={TYPOGRAPHY.R3}>
                  <b>Confirmed At:</b>{" "}
                  {successParams?.timestamp.fromNow() ?? "recently"}
                </Typography>
                <Typography variant={TYPOGRAPHY.R3}>
                  <b>Confirmation ID:</b> {successParams.confirmationCode}
                </Typography>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

