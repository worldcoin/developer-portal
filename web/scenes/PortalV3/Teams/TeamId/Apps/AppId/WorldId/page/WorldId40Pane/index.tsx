"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { Notification } from "@/components/Notification";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { RpRegistrationStatus } from "@/lib/rp-registration-status";
import { WorldId40Settings } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId40/page/WorldId40Settings";
import {
  type RpEnvironment,
  useRpRegistrationController,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId40/page/use-rp-registration-controller";
import { toast } from "react-toastify";

export const WorldId40Pane = (props: {
  appId: string;
  rpId: string;
  initialStatus: RpRegistrationStatus;
  initialStagingStatus: RpRegistrationStatus | null;
  mode: string;
  createdAt: string;
  canManageWorldId: boolean;
  onRpChanged?: (status?: RpRegistrationStatus) => void;
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
    if (status !== RpRegistrationStatus.Failed) return null;

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

  const productionStatusContent =
    productionStatus === RpRegistrationStatus.Pending ? (
      <Notification variant="info">
        <div>
          <Typography as="p" variant={TYPOGRAPHY.S3}>
            Registration in progress
          </Typography>
          <Typography
            as="p"
            variant={TYPOGRAPHY.S4}
            className="mt-1 text-grey-500"
          >
            World ID settings will be available after registration.
          </Typography>
        </div>
      </Notification>
    ) : productionStatus === RpRegistrationStatus.Deactivated ? (
      <Notification variant="warning">
        <div>
          <Typography as="p" variant={TYPOGRAPHY.S3}>
            Registration deactivated
          </Typography>
          <Typography
            as="p"
            variant={TYPOGRAPHY.S4}
            className="mt-1 text-grey-500"
          >
            This RP is no longer active.
          </Typography>
        </div>
      </Notification>
    ) : null;

  const isRegistered = productionStatus === RpRegistrationStatus.Registered;

  return (
    <div className="flex max-w-[580px] flex-col gap-y-8 py-2">
      {isRegistered ? (
        <Typography variant={TYPOGRAPHY.B3} className="text-grey-500">
          Registered {formattedDate}
        </Typography>
      ) : null}

      {productionStatusContent}
      {renderFailure("production")}
      {renderFailure("staging")}

      {isRegistered ? (
        <WorldId40Settings
          appId={props.appId}
          rpId={props.rpId}
          mode={props.mode}
          productionStatus={productionStatus}
          variant="embedded"
          canManageWorldId={props.canManageWorldId}
          onProductionPending={markProductionPending}
          onModeSwitchSuccess={() => props.onRpChanged?.()}
        />
      ) : null}
    </div>
  );
};
