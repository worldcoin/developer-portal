"use client";

import { CopyButton } from "@/components/CopyButton";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Notification } from "@/components/Notification";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useRetryRpMutation } from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId40/page/graphql/client/retry-rp.generated";
import { RotateSignerKeyDialog } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId40/page/RotateSignerKeyDialog";
import { SwitchToSelfManagedDialog } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId40/page/SwitchToSelfManagedDialog";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

export type RpStatus = "pending" | "registered" | "failed" | "deactivated";

const FieldRow = (props: { label: string; value: string; copy?: boolean }) => (
  <div className="flex items-center justify-between">
    <div className="flex flex-col gap-0.5">
      <Typography variant={TYPOGRAPHY.B4} className="text-grey-500">
        {props.label}
      </Typography>
      <Typography variant={TYPOGRAPHY.B3} className="text-grey-900">
        {props.value}
      </Typography>
    </div>
    {props.copy ? (
      <CopyButton
        fieldName={props.label}
        fieldValue={props.value}
        className="text-grey-500"
      />
    ) : null}
  </div>
);

// The World ID 4.0 pane of the World ID page. Adapted from the standalone
// WorldId40Content: the Production/Staging status rows are intentionally dropped
// (they carry no actionable signal); a failed registration surfaces a banner +
// Retry instead, and status is polled only while pending.
export const WorldId40Pane = (props: {
  appId: string;
  rpId: string;
  initialStatus: RpStatus;
  initialStagingStatus: RpStatus | null;
  mode: string;
  createdAt: string;
  // Re-runs the parent's Apollo overview query. `mode` comes from that query
  // (client cache), so router.refresh() would NOT update it — a stale "managed"
  // mode would re-enable the managed-only controls once polling settles.
  onRpChanged?: () => void;
}) => {
  const [retryRpMutation] = useRetryRpMutation();
  const [status, setStatus] = useState<RpStatus>(props.initialStatus);
  const [stagingStatus, setStagingStatus] = useState<RpStatus | null>(
    props.initialStagingStatus,
  );
  const [isRotateOpen, setIsRotateOpen] = useState(false);
  const [isSwitchOpen, setIsSwitchOpen] = useState(false);
  const [retryingEnvironment, setRetryingEnvironment] = useState<
    "production" | "staging" | null
  >(null);

  // Guards against a slow status fetch piling up behind the 5s poll ticks.
  const statusFetchInFlight = useRef(false);

  const fetchStatus = useCallback(async () => {
    if (statusFetchInFlight.current) {
      return;
    }
    statusFetchInFlight.current = true;
    try {
      const response = await fetch(`/api/v4/rp-status/${props.rpId}`, {
        signal: AbortSignal.timeout(4000),
      });
      if (response.ok) {
        const data = await response.json();
        setStatus(data.production_status as RpStatus);
        setStagingStatus(
          data.staging_status == null
            ? null
            : (data.staging_status as RpStatus),
        );
      }
    } catch {
      // Keep the current status on error.
    } finally {
      statusFetchInFlight.current = false;
    }
  }, [props.rpId]);

  // Poll every 5 seconds only while the registration is still settling; skip
  // ticks while the tab is hidden.
  useEffect(() => {
    if (status === "pending" || stagingStatus === "pending") {
      const interval = setInterval(() => {
        if (!document.hidden) {
          void fetchStatus();
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [status, stagingStatus, fetchStatus]);

  const handleRetry = async (environment: "production" | "staging") => {
    setRetryingEnvironment(environment);
    try {
      const { data } = await retryRpMutation({
        variables: { rp_id: props.rpId, environment },
      });
      if (data?.retry_rp?.success) {
        if (environment === "production") {
          setStatus("pending");
        } else {
          setStagingStatus("pending");
        }
      }
    } catch {
      toast.error("Failed to retry registration — please try again");
    } finally {
      setRetryingEnvironment(null);
    }
  };

  const isActive = status === "registered";
  const isSelfManaged = props.mode === "self_managed";
  const modeLabel = props.mode === "managed" ? "Managed" : "Self-Managed";
  const formattedDate = new Date(props.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex max-w-[580px] flex-col gap-y-8 py-2">
      <Typography variant={TYPOGRAPHY.B3} className="text-grey-500">
        Registered {formattedDate}
      </Typography>

      {(["production", "staging"] as const).map((environment) => {
        const environmentStatus =
          environment === "production" ? status : stagingStatus;
        if (environmentStatus !== "failed") {
          return null;
        }

        const isRetrying = retryingEnvironment === environment;
        return (
          <Notification
            key={environment}
            variant="warning"
            className="items-start"
          >
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
              <DecoratedButton
                type="button"
                variant="primary"
                className="h-8 shrink-0 rounded-full px-4 py-0 text-xs"
                disabled={isRetrying}
                onClick={() => void handleRetry(environment)}
              >
                {isRetrying ? "Retrying..." : "Try again"}
              </DecoratedButton>
            </div>
          </Notification>
        );
      })}

      <FieldRow label="APP ID (Legacy)" value={props.appId} copy />
      <FieldRow label="RP ID" value={props.rpId} copy />
      <FieldRow label="Management Mode" value={modeLabel} />

      <div className="mt-2 flex flex-col gap-4">
        <Typography variant={TYPOGRAPHY.S2} className="text-gray-900">
          Key
        </Typography>
        <div className="rounded-xl border border-grey-100 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Typography variant={TYPOGRAPHY.S2}>Reset signer key</Typography>
              <Typography variant={TYPOGRAPHY.B3} className="text-grey-500">
                This will create a new signer key and disable the existing key
              </Typography>
            </div>
            <DecoratedButton
              type="button"
              variant="secondary"
              disabled={!isActive || isSelfManaged}
              className="h-8 rounded-full px-4 py-0 text-xs"
              onClick={() => setIsRotateOpen(true)}
            >
              Reset
            </DecoratedButton>
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-y-6">
        <Typography variant={TYPOGRAPHY.S2} className="text-gray-900">
          Danger zone
        </Typography>
        <div className="rounded-[10px] border border-grey-100 px-6 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col gap-1">
              <Typography variant={TYPOGRAPHY.S2}>
                Switch to Self-Managed
              </Typography>
              <Typography variant={TYPOGRAPHY.B3} className="text-grey-500">
                Move this RP to a self-managed configuration
              </Typography>
            </div>
            <DecoratedButton
              type="button"
              variant="danger"
              disabled={!isActive || isSelfManaged}
              className="h-8 shrink-0 rounded-full px-4 text-[13px] font-semibold"
              onClick={() => setIsSwitchOpen(true)}
            >
              Switch
            </DecoratedButton>
          </div>
        </div>
      </div>

      <RotateSignerKeyDialog
        open={isRotateOpen}
        onClose={() => setIsRotateOpen(false)}
        appId={props.appId}
        onSuccess={() => setStatus("pending")}
      />

      <SwitchToSelfManagedDialog
        open={isSwitchOpen}
        onClose={() => setIsSwitchOpen(false)}
        appId={props.appId}
        onSuccess={() => {
          setStatus("pending");
          props.onRpChanged?.();
        }}
      />
    </div>
  );
};
