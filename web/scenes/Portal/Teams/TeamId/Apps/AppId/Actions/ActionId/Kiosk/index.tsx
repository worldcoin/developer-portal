"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { useState } from "react";
import { ActionsHeader } from "../Common/ActionsHeader";
import { ActiveKioskPage } from "./ActiveKiosk";
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
  const [showKiosk, setShowKiosk] = useState(false);

  const appId = params?.appId as `app_${string}`;
  const actionId = params?.actionId as `action_${string}`;
  const teamId = params?.teamId as `team_${string}`;

  const [toggleKiosk] = useToggleKioskMutation({
    context: { headers: { team_id: teamId } },
  });

  const { data, loading } = useGetKioskActionQuery({
    variables: {
      action_id: actionId,
      app_id: appId,
    },
    context: { headers: { team_id: teamId } },
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
      context: { headers: { team_id: teamId } },
      refetchQueries: [GetKioskActionDocument],
    });
  };
  const kioskAction = data?.action[0];

  return (
    <div className="flex size-full w-full flex-col items-center ">
      <div className="grid w-full gap-y-2 py-10">
        <ActionsHeader appId={appId} actionId={actionId} teamId={teamId} />
        <hr className="my-5 w-full border-dashed text-grey-200" />
      </div>
      {showKiosk && data && (
        <ActiveKioskPage
          params={params}
          data={data}
          toggleKiosk={setShowKiosk}
        />
      )}
      <div className="grid w-full grid-cols-1fr/auto items-start justify-start gap-y-5">
        <div
          className={clsx("grid max-w-[480px] gap-y-10", {
            hidden: showKiosk,
          })}
        >
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
                type="button"
                variant="primary"
                onClick={() => setShowKiosk(true)}
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
        </div>
        <div></div>
      </div>
    </div>
  );
};
