"use client";

import { CopyButton } from "@/components/CopyButton";
import { DecoratedButton } from "@/components/DecoratedButton";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useCallback, useEffect, useState } from "react";
import { RotateSignerKeyDialog } from "./RotateSignerKeyDialog";

type RpStatus = "pending" | "registered" | "failed" | "deactivated";

const statusConfig: Record<
  RpStatus,
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  pending: {
    label: "Pending",
    color: "text-amber-500",
    bgColor: "bg-yellow-50",
    dotColor: "bg-amber-500",
  },
  registered: {
    label: "Active",
    color: "text-green-500",
    bgColor: "bg-green-50",
    dotColor: "bg-green-500",
  },
  failed: {
    label: "Rejected",
    color: "text-system-error-500",
    bgColor: "bg-red-50",
    dotColor: "bg-system-error-500",
  },
  deactivated: {
    label: "Deactivated",
    color: "text-grey-500",
    bgColor: "bg-grey-100",
    dotColor: "bg-grey-500",
  },
};

type WorldId40ContentProps = {
  appId: string;
  rpId: string;
  initialStatus: RpStatus;
  mode: string;
  signerAddress: string | null;
  createdAt: string;
};

export const WorldId40Content = ({
  appId,
  rpId,
  initialStatus,
  mode,
  createdAt,
}: WorldId40ContentProps) => {
  const [productionStatus, setProductionStatus] =
    useState<RpStatus>(initialStatus);
  const [stagingStatus, setStagingStatus] = useState<RpStatus | null>(null);
  const [isRotateDialogOpen, setIsRotateDialogOpen] = useState(false);
  const [retryingEnvironment, setRetryingEnvironment] = useState<string | null>(
    null,
  );

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/v4/rp-status/${rpId}`);
      if (response.ok) {
        const data = await response.json();
        setProductionStatus(data.production_status as RpStatus);
        setStagingStatus(
          data.staging_status != null
            ? (data.staging_status as RpStatus)
            : null,
        );
      }
    } catch {
      // Keep the current status on error
    }
  }, [rpId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll every 5 seconds while either status is pending
  useEffect(() => {
    const shouldPoll =
      productionStatus === "pending" || stagingStatus === "pending";
    if (shouldPoll) {
      const interval = setInterval(fetchStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [productionStatus, stagingStatus, fetchStatus]);

  const handleRetry = async (environment: "production" | "staging") => {
    setRetryingEnvironment(environment);
    try {
      const response = await fetch(`/api/v4/rp-retry/${rpId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ environment }),
      });

      if (response.ok) {
        // Set the retried environment to pending and resume polling
        if (environment === "production") {
          setProductionStatus("pending");
        } else {
          setStagingStatus("pending");
        }
      }
    } catch {
      // Keep current status on error
    } finally {
      setRetryingEnvironment(null);
    }
  };

  // Use production status for overall "active" checks (e.g., enabling reset button)
  const isActive = productionStatus === "registered";

  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const modeLabel = mode === "managed" ? "Managed" : "Self-Managed";

  const renderStatusRow = (
    label: string,
    status: RpStatus,
    environment: "production" | "staging",
  ) => {
    const info = statusConfig[status] || statusConfig.pending;
    const isFailed = status === "failed";
    const isRetrying = retryingEnvironment === environment;

    return (
      <div className="flex flex-col gap-0.5">
        <Typography variant={TYPOGRAPHY.B4} className="text-gray-500">
          {label}
        </Typography>
        <div className="flex items-center justify-between rounded-xl">
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center rounded-full p-1 ${info.bgColor}`}
            >
              <div className={`size-2 rounded-full ${info.dotColor}`} />
            </div>
            <Typography variant={TYPOGRAPHY.B3} className={info.color}>
              {info.label}
            </Typography>
          </div>
          {isFailed && (
            <DecoratedButton
              type="button"
              variant="primary"
              className="h-8 rounded-full px-4 py-0 text-xs"
              disabled={isRetrying}
              onClick={() => handleRetry(environment)}
            >
              {isRetrying ? "Retrying..." : "Try again"}
            </DecoratedButton>
          )}
        </div>
      </div>
    );
  };

  return (
    <SizingWrapper className="py-10">
      <div className="flex max-w-[580px] flex-col gap-y-8">
        {/* Header */}
        <div className="flex flex-col gap-y-3">
          <Typography
            variant={TYPOGRAPHY.H6}
            className="text-2xl font-semibold"
          >
            World ID 4.0
          </Typography>
          <Typography variant={TYPOGRAPHY.B3} className="text-grey-500">
            Registered {formattedDate}
          </Typography>
        </div>

        {/* RP ID */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <Typography variant={TYPOGRAPHY.B4} className="text-grey-500">
              RP ID
            </Typography>
            <Typography variant={TYPOGRAPHY.B3} className="text-grey-900">
              {rpId}
            </Typography>
          </div>
          <CopyButton
            fieldName="RP ID"
            fieldValue={rpId}
            className="text-grey-500"
          />
        </div>

        {/* Management Mode */}
        <div className="flex flex-col gap-0.5">
          <Typography variant={TYPOGRAPHY.B4} className="text-grey-500">
            Management Mode
          </Typography>
          <Typography variant={TYPOGRAPHY.B3} className="text-grey-900">
            {modeLabel}
          </Typography>
        </div>

        {/* Status */}
        {renderStatusRow("Production Status", productionStatus, "production")}
        {renderStatusRow(
          "Staging Status",
          stagingStatus ?? "failed",
          "staging",
        )}

        {/* Key Section */}
        <div className="mt-4 flex flex-col gap-4">
          <Typography variant={TYPOGRAPHY.S2} className="text-gray-900">
            Key
          </Typography>

          <div className="rounded-xl border border-grey-100 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Typography variant={TYPOGRAPHY.S2} className="text-gray-900">
                  Reset signer key
                </Typography>
                <Typography variant={TYPOGRAPHY.B3} className="text-grey-500">
                  This will create a new signer key and disable the existing key
                </Typography>
              </div>
              <DecoratedButton
                type="button"
                variant="secondary"
                disabled={!isActive}
                className="h-8 rounded-full px-4 py-0 text-xs"
                onClick={() => setIsRotateDialogOpen(true)}
              >
                Reset
              </DecoratedButton>
            </div>
          </div>
        </div>
        {/* TODO: Danger Zone - not implemented yet
        <div className="mt-4 flex flex-col gap-y-6">
          <Typography variant={TYPOGRAPHY.S2} className="text-gray-900">
            Danger zone
          </Typography>

          <div className="rounded-xl border border-grey-100 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Typography variant={TYPOGRAPHY.S2} className="text-gray-900">
                  Deactivate RP
                </Typography>
                <Typography variant={TYPOGRAPHY.B3} className="text-grey-500">
                  Deactivate this RP and stop all related activity
                </Typography>
              </div>
              <DecoratedButton
                type="button"
                variant={isActive ? "danger" : "secondary"}
                disabled={!isActive}
                className="h-8 rounded-full px-4 py-0 text-xs"
              >
                Deactivate
              </DecoratedButton>
            </div>
          </div>

          <div className="rounded-xl border border-grey-100 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Typography variant={TYPOGRAPHY.S2} className="text-gray-900">
                  Switch to Self-Managed
                </Typography>
                <Typography variant={TYPOGRAPHY.B3} className="text-grey-500">
                  Move this RP to a self-managed configuration
                </Typography>
              </div>
              <DecoratedButton
                type="button"
                variant={isActive ? "danger" : "secondary"}
                disabled={!isActive}
                className="h-8 rounded-full px-4 py-0 text-xs"
              >
                Switch
              </DecoratedButton>
            </div>
          </div>
        </div>
        */}
      </div>

      <RotateSignerKeyDialog
        open={isRotateDialogOpen}
        onClose={() => setIsRotateDialogOpen(false)}
        appId={appId}
        onSuccess={() => setProductionStatus("pending")}
      />
    </SizingWrapper>
  );
};
