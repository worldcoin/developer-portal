"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { DestructiveTriggerButton } from "@/components/DestructiveTriggerButton";
import { Notification } from "@/components/Notification";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { RpRegistrationStatus } from "@/lib/rp-registration-status";
import { RotateSignerKeyDialog } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId40/page/RotateSignerKeyDialog";
import { SwitchToSelfManagedDialog } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId40/page/SwitchToSelfManagedDialog";
import {
  type RpEnvironment,
  useRpRegistrationController,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId40/page/use-rp-registration-controller";
import { useState } from "react";
import { toast } from "react-toastify";
import { SummaryField } from "./SummaryField";

export const RpSummary = (props: {
  appId: string;
  rpId: string;
  signerAddress: string | null;
  initialStatus: RpRegistrationStatus;
  initialStagingStatus: RpRegistrationStatus | null;
  mode: string;
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
  const signerAddress = isSelfManaged
    ? "Unavailable in Portal"
    : props.signerAddress ?? "Not available";
  const controlsDisabledReason = isActive
    ? !props.canManageWorldId
      ? "Ask a team owner or admin to change RP settings."
      : isSelfManaged
        ? "Signer keys are managed outside the Portal."
        : null
    : null;
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
        aria-label="World ID configuration"
        className="flex w-full max-w-[580px] flex-col gap-4"
      >
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-5">
            <SummaryField label="App ID" value={props.appId} copy />
            <SummaryField label="RP ID" value={props.rpId} copy />
            <SummaryField
              label="Signer address"
              value={signerAddress}
              copy={!isSelfManaged && Boolean(props.signerAddress)}
            />
          </div>

          {isActive ? (
            <div className="flex flex-col gap-6">
              {controlsDisabledReason ? (
                <Typography
                  id="world-id-configuration-disabled-reason"
                  as="p"
                  variant={TYPOGRAPHY.B4}
                  className="text-grey-500"
                >
                  {controlsDisabledReason}
                </Typography>
              ) : null}

              <div className="flex flex-col gap-4">
                <Typography as="h3" variant={TYPOGRAPHY.S2}>
                  Key
                </Typography>

                <div className="flex items-center justify-between gap-4 rounded-xl border border-grey-100 p-6">
                  <div className="flex flex-col gap-1">
                    <Typography variant={TYPOGRAPHY.S2}>
                      Rotate signer key
                    </Typography>
                    <Typography
                      variant={TYPOGRAPHY.B3}
                      className="text-grey-500"
                    >
                      This will create a new signer key and disable the existing
                      key
                    </Typography>
                  </div>

                  <DecoratedButton
                    type="button"
                    variant="secondary"
                    disabled={!props.canManageWorldId || isSelfManaged}
                    className="h-8 shrink-0 rounded-full px-4 py-0 text-xs"
                    aria-describedby={
                      controlsDisabledReason
                        ? "world-id-configuration-disabled-reason"
                        : undefined
                    }
                    onClick={() => setIsRotateOpen(true)}
                  >
                    Rotate signer key
                  </DecoratedButton>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <Typography as="h3" variant={TYPOGRAPHY.S2}>
                  Danger zone
                </Typography>

                <div className="flex items-center justify-between gap-4 rounded-[10px] border border-grey-100 px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <Typography variant={TYPOGRAPHY.S2}>
                      Switch to self-managed
                    </Typography>
                    <Typography
                      variant={TYPOGRAPHY.B3}
                      className="text-grey-500"
                    >
                      Move this RP to a self-managed configuration
                    </Typography>
                  </div>

                  <DestructiveTriggerButton
                    disabled={!props.canManageWorldId || isSelfManaged}
                    className="shrink-0"
                    aria-describedby={
                      controlsDisabledReason
                        ? "world-id-configuration-disabled-reason"
                        : undefined
                    }
                    onClick={() => setIsSwitchOpen(true)}
                  >
                    Switch to self-managed
                  </DestructiveTriggerButton>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {productionStatus === RpRegistrationStatus.Pending ? (
          <Notification variant="info">
            <div>
              <Typography as="p" variant={TYPOGRAPHY.S3}>
                Configuration in progress
              </Typography>
              <Typography
                as="p"
                variant={TYPOGRAPHY.S4}
                className="mt-1 text-grey-500"
              >
                Your relying party configuration is being processed on-chain.
                This usually takes a few minutes.
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
      </section>

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
