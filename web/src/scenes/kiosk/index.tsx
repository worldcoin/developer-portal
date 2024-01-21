import { ISuccessResult } from "@worldcoin/idkit-core";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { memo, useCallback, useEffect } from "react";
import { Icon } from "src/components/Icon";
import { restAPIRequest } from "src/lib/frontend-api";
import { KioskProps } from "@/pages/team/[team_id]/kiosk/[action_id]";
import {
  IKioskStore,
  KioskScreen,
  useKioskStore,
} from "../../stores/kioskStore";
import { Connected } from "./Connected";
import { IDKitBridge } from "./IDKitBridge";
import { KioskError } from "./KioskError";
import { Success } from "./Success";
import { Waiting } from "./Waiting";
import Image from "next/image";

type ProofResponse = {
  success: boolean;
  action_id?: string;
  nullifier_hash?: string;
  created_at?: string;
  code?: string;
  detail?: string;
  attribute?: string;
};

const getKioskStoreParams = (store: IKioskStore) => ({
  setScreen: store.setScreen,
  screen: store.screen,
  kioskAction: store.kioskAction,
  setKioskAction: store.setKioskAction,
  setSuccessParams: store.setSuccessParams,
  proofResult: store.proofResult,
  successParams: store.successParams,
});

export const Kiosk = memo(function Kiosk({ action, error_code }: KioskProps) {
  const router = useRouter();

  const {
    kioskAction,
    screen,
    setScreen,
    setKioskAction,
    proofResult,
    setSuccessParams,
    successParams,
  } = useKioskStore(getKioskStoreParams);

  useEffect(() => {
    if (action && !kioskAction) {
      setKioskAction(action);
    } else if (!kioskAction) {
      setScreen(KioskScreen.InvalidRequest);
    }
  }, [action, setKioskAction, setScreen, kioskAction]);

  const handleClickBack = useCallback(() => {
    router.push("/"); // FIXME: define back url
  }, [router]);

  const verifyProof = useCallback(
    async (result: ISuccessResult) => {
      let response;
      try {
        response = await restAPIRequest<ProofResponse>(
          `/verify/${kioskAction?.app.id}`,
          {
            method: "POST",
            json: { action: kioskAction?.action, signal: "", ...result },
          }
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
        setSuccessParams({
          timestamp: dayjs(response.created_at),
          confirmationCode:
            response.nullifier_hash?.slice(-5).toLocaleUpperCase() ?? "",
        });

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
    [kioskAction, setScreen, setSuccessParams]
  );

  useEffect(() => {
    if (proofResult && !successParams) {
      verifyProof(proofResult);
    }
  }, [proofResult, verifyProof, successParams]);

  return (
    <div className="flex flex-col h-screen">
      <header className="relative shrink-0 flex items-center justify-center h-[86px]">
        <div className="absolute top-0 bottom-0 left-0 flex items-center pl-4">
          <button
            className="flex items-center justify-center w-9 h-9 bg-ebecef rounded-full"
            onClick={handleClickBack}
          >
            {/* FIXME: Add default logo */}
            <Icon name="arrow-left" className="w-6 h-6" />
          </button>
        </div>

        <div className="flex justify-center">
          <Icon name="logo" className="w-[142px] h-6" />
        </div>
        {/* FIXME: This will be removed later so just fixing for type check */}
        <div className="absolute top-0 bottom-0 right-0 flex items-center gap-x-4 pr-6">
          <div className="font-rubik font-medium text-14">
            {kioskAction?.app.app_metadata?.name}
          </div>
          <Image
            src={kioskAction?.app.app_metadata?.logo_img_url ?? ""}
            alt="logo"
            width={200}
            height={200}
            className="w-11 h-11 rounded-full"
          />
        </div>
      </header>

      <div className="grow grid grid-rows-auto/1fr/auto items-center justify-center portrait:py-12 landscape:py-4">
        <div className="flex flex-col items-center mb-8">
          <h1 className="font-sora font-semibold text-32 leading-10">
            World ID Kiosk Verification
          </h1>

          {kioskAction?.description && (
            <div className="max-w-[400px] portrait:mt-12 landscape:mt-6 grid grid-cols-auto/1fr items-center p-4 bg-primary rounded-2xl">
              <div className="font-rubik text-16 text-ffffff leading-5">
                {kioskAction.description}
              </div>
            </div>
          )}
        </div>

        {(!kioskAction || error_code) && (
          <KioskError
            title="This request is invalid."
            error_code={error_code}
          />
        )}

        {kioskAction && (
          <IDKitBridge
            app_id={kioskAction.app.id}
            action={kioskAction.action}
            action_description={kioskAction.description}
          />
        )}

        {screen === KioskScreen.Waiting && <Waiting />}
        {screen === KioskScreen.Connected && <Connected />}
        {screen === KioskScreen.Success && <Success />}

        {screen === KioskScreen.ConnectionError && (
          <KioskError
            title="Connection Error"
            description="We cannot establish a connection to the person's World App. Please refresh and try again."
            buttonText="Retry"
          />
        )}

        {screen === KioskScreen.AlreadyVerified && (
          <KioskError
            title="Already Verified"
            description="This person has already verified for this action."
            buttonText="New verification"
          />
        )}

        {screen === KioskScreen.VerificationRejected && (
          <KioskError
            title="Verification Rejected"
            description="Person rejected the verification in the World App."
            buttonText="Try again"
          />
        )}

        {screen === KioskScreen.InvalidIdentity && (
          <KioskError
            title="Not verified"
            description="Person is not verified with World ID. They can visit an orb to verify."
            buttonText="New verification"
          />
        )}

        {screen === KioskScreen.VerificationError && (
          <KioskError
            title="Verification Error"
            description="We couldn't verify this person. Please try again."
            buttonText="Retry"
          />
        )}

        {/* TODO: Implement for authenticated users */}
        {/* {actions.length > 0 && currentAction && (
          <div className="flex flex-col items-center gap-y-2">
            <div className="font-rubik font-medium text-16 leading-5">
              Choose Action
            </div>

            <ActionSelect
              value={currentAction}
              onChange={handleActionChange}
              options={actions}
            />
          </div>
        )} */}
      </div>
    </div>
  );
});
