"use client";

import { CopyButton } from "@/components/CopyButton";
import { DecoratedButton } from "@/components/DecoratedButton";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useEffect, useState } from "react";

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
  rpId: string;
  initialStatus: RpStatus;
  mode: string;
  createdAt: string;
};

export const WorldId40Content = ({
  rpId,
  initialStatus,
  mode,
  createdAt,
}: WorldId40ContentProps) => {
  const [status, setStatus] = useState<RpStatus>(initialStatus);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/v4/rp-status/${rpId}`);
        if (response.ok) {
          const data = await response.json();
          setStatus(data.status as RpStatus);
        }
      } catch {
        // Keep the current status on error
      }
    };

    fetchStatus();

    // Poll every 5 seconds while status is pending
    if (status === "pending") {
      const interval = setInterval(fetchStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [rpId, status]);

  const statusInfo = statusConfig[status] || statusConfig.pending;
  const isActive = status === "registered";
  const isFailed = status === "failed";

  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const modeLabel = mode === "managed" ? "Managed" : "Self-Managed";

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
        <div className="flex flex-col gap-0.5">
          <Typography variant={TYPOGRAPHY.B4} className="text-gray-500">
            Status
          </Typography>
          <div className="flex items-center justify-between rounded-xl">
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center rounded-full p-1 ${statusInfo.bgColor}`}
              >
                <div className={`size-2 rounded-full ${statusInfo.dotColor}`} />
              </div>
              <Typography variant={TYPOGRAPHY.B3} className={statusInfo.color}>
                {statusInfo.label}
              </Typography>
            </div>
            {isFailed && (
              <DecoratedButton
                type="button"
                variant="primary"
                className="h-8 rounded-full px-4 py-0 text-xs"
              >
                Try again
              </DecoratedButton>
            )}
          </div>
        </div>

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
              >
                Reset
              </DecoratedButton>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
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
      </div>
    </SizingWrapper>
  );
};
