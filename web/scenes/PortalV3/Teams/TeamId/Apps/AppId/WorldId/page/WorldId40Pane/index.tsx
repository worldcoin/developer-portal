"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { Notification } from "@/components/Notification";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { WorldId40Settings } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId40/page/WorldId40Settings";
import {
  type RpEnvironment,
  type RpStatus,
  useRpRegistrationController,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId40/page/use-rp-registration-controller";
import { toast } from "react-toastify";

export type { RpStatus } from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId40/page/use-rp-registration-controller";

export const WorldId40Pane = (props: {
  appId: string;
  rpId: string;
  initialStatus: RpStatus;
  initialStagingStatus: RpStatus | null;
  mode: string;
  createdAt: string;
  canManageWorldId: boolean;
  onRpChanged?: () => void;
}) => {
  const {
    productionStatus,
    stagingStatus,
    retryingEnvironment,
    retryRegistration,
    markProductionPending,
  } = useRpRegistrationController({
    rpId: props.rpId,
    initialProductionStatus: props.initialStatus,
    initialStagingStatus: props.initialStagingStatus,
    onStatusReconciled: props.onRpChanged,
    onRetryError: () =>
      toast.error("Failed to retry registration — please try again"),
  });

  const formattedDate = new Date(props.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const renderFailure = (environment: RpEnvironment) => {
    const status =
      environment === "production" ? productionStatus : stagingStatus;
    if (status !== "failed") return null;

    const isRetrying = retryingEnvironment === environment;
    return (
      <Notification key={environment} variant="warning" className="items-start">
        <div className="flex w-full items-center justify-between gap-4">
          <div>
            <Typography as="p" variant={TYPOGRAPHY.S3}>
              {environment === "production" ? "Production" : "Staging"}{" "}
              registration failed
            </Typography>
            <Typography
              as="p"
              variant={TYPOGRAPHY.S4}
              className="mt-1 text-grey-500"
            >
              Retry the on-chain registration for this RP.
            </Typography>
          </div>
          {props.canManageWorldId ? (
            <DecoratedButton
              type="button"
              variant="primary"
              className="h-8 shrink-0 rounded-full px-4 py-0 text-xs"
              disabled={isRetrying}
              onClick={() => void retryRegistration(environment)}
            >
              {isRetrying ? "Retrying..." : "Try again"}
            </DecoratedButton>
          ) : null}
        </div>
      </Notification>
    );
  };

  return (
    <div className="flex max-w-[580px] flex-col gap-y-8 py-2">
      <Typography variant={TYPOGRAPHY.B3} className="text-grey-500">
        Registered {formattedDate}
      </Typography>

      {renderFailure("production")}
      {renderFailure("staging")}

      <WorldId40Settings
        appId={props.appId}
        rpId={props.rpId}
        mode={props.mode}
        productionStatus={productionStatus}
        variant="embedded"
        canManageWorldId={props.canManageWorldId}
        onProductionPending={markProductionPending}
        onModeSwitchSuccess={props.onRpChanged}
      />
    </div>
  );
};
