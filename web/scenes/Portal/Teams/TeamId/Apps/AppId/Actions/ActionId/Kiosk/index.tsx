"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { EngineType } from "@/lib/types";
import { VerificationLevel } from "@worldcoin/idkit-core";
import clsx from "clsx";
import { useState } from "react";
import { ActionsHeader } from "../Components/ActionsHeader";
import { KioskError } from "../Components/Kiosk/KioskError";
import { VerificationLevelPicker } from "../Components/Kiosk/VerificationLevelPicker";
import {
  GetKioskActionDocument,
  useGetKioskActionQuery,
} from "./graphql/client/get-kiosk-action.generated";
import { useToggleKioskMutation } from "./graphql/client/toggle-kiosk.generated";

type ActionIdKioskPageProps = {
  params: Record<string, string> | null | undefined;
};
export const ActionIdKioskPage = (props: ActionIdKioskPageProps) => {
  const { params } = props;
  const [kioskVerificationLevel, setKioskVerificationLevel] =
    useState<VerificationLevel>(VerificationLevel.Device);

  const appId = params?.appId as `app_${string}`;
  const actionId = params?.actionId as `action_${string}`;
  const teamId = params?.teamId as `team_${string}`;
  const [toggleKiosk] = useToggleKioskMutation();

  const { data } = useGetKioskActionQuery({
    variables: {
      action_id: actionId,
      app_id: appId,
    },
  });

  const handleToggleKiosk = async (status: boolean) => {
    if (!actionId) {
      return;
    }

    await toggleKiosk({
      variables: {
        id: actionId,
        kiosk_status: status,
      },

      refetchQueries: [GetKioskActionDocument],
    });
  };
  const kioskAction = data?.action[0];
  const kioskApp = data?.app_by_pk;

  return (
    <>
      <SizingWrapper gridClassName="order-1 pt-6 md:pt-10">
        <ActionsHeader appId={appId} actionId={actionId} teamId={teamId} />

        <hr className="mt-5 w-full border-dashed text-grey-200" />
      </SizingWrapper>

      <SizingWrapper gridClassName="order-2 pt-6 pb-6 md:pt-10 md:pb-10">
        <div className="grid w-full grid-cols-1 items-start justify-between gap-x-32 gap-y-10 md:grid-cols-1fr/auto">
          <div className={clsx("grid max-w-[480px] gap-y-10")}>
            <div className="grid gap-y-5">
              <Typography variant={TYPOGRAPHY.H6} className="text-grey-700">
                What is Kiosk?
              </Typography>

              <Typography variant={TYPOGRAPHY.R3} className="text-grey-700">
                Kiosk allows you to verify users with World ID in person.
                Activating it will create a screen that displays a large QR code
                to verify with World ID. Use it to run promotions, giveaways, or
                ensure any in person event has only unique humans.
              </Typography>
            </div>

            {kioskApp?.engine === EngineType.OnChain && (
              <KioskError
                title="Kiosk is not available"
                description="Kiosk is not available for on-chain app actions"
              />
            )}

            {kioskApp?.engine === EngineType.Cloud && (
              <div className="grid gap-y-5">
                <Typography variant={TYPOGRAPHY.R3} className="text-grey-700">
                  This action&apos;s kiosk is currently:{" "}
                  <span
                    className={clsx("text-system-error-500", {
                      "text-system-success-500": kioskAction?.kiosk_enabled,
                    })}
                  >
                    {kioskAction?.kiosk_enabled ? "Enabled" : "Disabled"}
                  </span>
                </Typography>

                {kioskAction?.kiosk_enabled && (
                  <VerificationLevelPicker
                    verificationLevel={kioskVerificationLevel}
                    resetKioskAndUpdateVerificationLevel={
                      setKioskVerificationLevel
                    }
                    className="justify-start"
                  />
                )}

                {!kioskAction?.kiosk_enabled ? (
                  <DecoratedButton
                    type="button"
                    variant="primary"
                    onClick={() => handleToggleKiosk(true)}
                  >
                    Activate Kiosk
                  </DecoratedButton>
                ) : (
                  <DecoratedButton
                    variant="primary"
                    href={`/kiosk/${appId}/${actionId}?verification-level=${kioskVerificationLevel}`}
                  >
                    Open Kiosk
                  </DecoratedButton>
                )}

                {kioskAction?.kiosk_enabled && (
                  <DecoratedButton
                    type="button"
                    variant="danger"
                    onClick={() => handleToggleKiosk(false)}
                  >
                    Deactivate Kiosk
                  </DecoratedButton>
                )}
              </div>
            )}
          </div>
        </div>
      </SizingWrapper>
    </>
  );
};
