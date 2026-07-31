"use client";

import { CopyButton } from "@/components/CopyButton";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Notification } from "@/components/Notification";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { RpRegistrationStatus } from "@/lib/rp-registration-status";
import { RotateSignerKeyDialog } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId40/page/RotateSignerKeyDialog";
import { SwitchToSelfManagedDialog } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId40/page/SwitchToSelfManagedDialog";
import { opticalIconClassName } from "@/scenes/PortalV3/common/Icon";
import {
  type RpEnvironment,
  useRpRegistrationController,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId40/page/use-rp-registration-controller";
import clsx from "clsx";
import { useState } from "react";
import { toast } from "react-toastify";

const SummaryField = (props: {
  label: string;
  value: string;
  copy?: boolean;
}) => (
  <div className="min-w-0">
    <Typography variant={TYPOGRAPHY.B4} className="text-grey-500">
      {props.label}
    </Typography>
    <div className="mt-1 flex min-w-0 items-center gap-2">
      <Typography
        variant={TYPOGRAPHY.B3}
        className="min-w-0 truncate text-grey-900"
        title={props.value}
      >
        {props.value}
      </Typography>
      {props.copy ? (
        <CopyButton
          fieldName={props.label}
          fieldValue={props.value}
          className="shrink-0 !pr-0 text-grey-500"
          iconClassName={clsx("!size-4", opticalIconClassName)}
        />
      ) : null}
    </div>
  </div>
);

const statusLabel: Record<RpRegistrationStatus, string> = {
  [RpRegistrationStatus.Pending]: "Configuration pending",
  [RpRegistrationStatus.Registered]: "Registered",
  [RpRegistrationStatus.Failed]: "Registration failed",
  [RpRegistrationStatus.Deactivated]: "Deactivated",
};

export const RpSummary = (props: {
  appId: string;
  rpId: string;
  signerAddress: string | null;
  initialStatus: RpRegistrationStatus;
  initialStagingStatus: RpRegistrationStatus | null;
  mode: string;
  createdAt: string;
  canManageWorldId: boolean;
  onRpChanged?: (status?: RpRegistrationStatus) => void;
}) => {
  const [isRotateOpen, setIsRotateOpen] = useState(false);
  const [isSwitchOpen, setIsSwitchOpen] = useState(false);
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
      toast.error("Failed to retry registration. Please try again"),
  });

  const isActive = productionStatus === RpRegistrationStatus.Registered;
  const isSelfManaged = props.mode === "self_managed";
  const modeLabel = isSelfManaged ? "Self-managed" : "Managed";
  const signerAddress = isSelfManaged
    ? "Unavailable in Portal"
    : props.signerAddress ?? "Not available";
  const controlsDisabledReason = !props.canManageWorldId
    ? "Ask a team owner or admin to change RP settings."
    : isSelfManaged
      ? "Signer keys are managed outside the Portal."
      : !isActive
        ? "The RP must be active before its configuration can be changed."
        : null;
  const formattedDate = new Date(props.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const handleConfigurationChanged = () => {
    markProductionPending();
    props.onRpChanged?.(RpRegistrationStatus.Pending);
  };

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

  return (
    <>
      <section
        aria-labelledby="world-id-configuration-title"
        className="rounded-xl border border-grey-100 bg-white p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Typography
              id="world-id-configuration-title"
              as="h2"
              variant={TYPOGRAPHY.S2}
            >
              World ID configuration
            </Typography>
            <Typography
              as="p"
              variant={TYPOGRAPHY.B4}
              className="mt-1 text-grey-500"
            >
              Created {formattedDate}
            </Typography>
          </div>
          <span
            className={clsx(
              "rounded-full px-3 py-1 font-world text-12 font-medium",
              productionStatus === RpRegistrationStatus.Registered
                ? "bg-system-success-50 text-system-success-700"
                : productionStatus === RpRegistrationStatus.Failed
                  ? "bg-system-error-50 text-system-error-600"
                  : "text-grey-600 bg-grey-50",
            )}
          >
            {statusLabel[productionStatus]}
          </span>
        </div>

        <div className="mt-5 grid gap-5 border-t border-grey-100 pt-5 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryField label="App ID" value={props.appId} copy />
          <SummaryField label="RP ID" value={props.rpId} copy />
          <SummaryField
            label="Signer address"
            value={signerAddress}
            copy={!isSelfManaged && Boolean(props.signerAddress)}
          />
          <SummaryField label="Management mode" value={modeLabel} />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-grey-100 pt-4">
          {controlsDisabledReason ? (
            <Typography
              id="world-id-configuration-disabled-reason"
              as="p"
              variant={TYPOGRAPHY.B4}
              className="mr-auto text-grey-500"
            >
              {controlsDisabledReason}
            </Typography>
          ) : null}
          <DecoratedButton
            type="button"
            variant="secondary"
            disabled={!props.canManageWorldId || !isActive || isSelfManaged}
            className="h-9 rounded-full px-4 py-0 text-xs"
            aria-describedby={
              controlsDisabledReason
                ? "world-id-configuration-disabled-reason"
                : undefined
            }
            onClick={() => setIsRotateOpen(true)}
          >
            Rotate signer key
          </DecoratedButton>
          <DecoratedButton
            type="button"
            variant="danger"
            disabled={!props.canManageWorldId || !isActive || isSelfManaged}
            className="h-9 shrink-0 rounded-full px-4 py-0 text-xs"
            aria-describedby={
              controlsDisabledReason
                ? "world-id-configuration-disabled-reason"
                : undefined
            }
            onClick={() => setIsSwitchOpen(true)}
          >
            Switch to self-managed
          </DecoratedButton>
        </div>
      </section>

      {productionStatus === RpRegistrationStatus.Pending ? (
        <Notification variant="info">
          <div>
            <Typography as="p" variant={TYPOGRAPHY.S3}>
              Configuration update pending
            </Typography>
            <Typography
              as="p"
              variant={TYPOGRAPHY.S4}
              className="mt-1 text-grey-500"
            >
              World ID configuration changes will be available after the update
              completes.
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
      ) : null}

      {renderFailure("production")}
      {renderFailure("staging")}

      <RotateSignerKeyDialog
        open={isRotateOpen}
        onClose={() => setIsRotateOpen(false)}
        appId={props.appId}
        onSuccess={handleConfigurationChanged}
      />

      <SwitchToSelfManagedDialog
        open={isSwitchOpen}
        onClose={() => setIsSwitchOpen(false)}
        appId={props.appId}
        onSuccess={handleConfigurationChanged}
      />
    </>
  );
};
