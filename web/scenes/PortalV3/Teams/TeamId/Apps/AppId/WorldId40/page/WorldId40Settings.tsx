"use client";

import { CopyButton } from "@/components/CopyButton";
import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { RpRegistrationStatus } from "@/lib/rp-registration-status";
import clsx from "clsx";
import type { ReactNode } from "react";
import { useState } from "react";
import { RotateSignerKeyDialog } from "./RotateSignerKeyDialog";
import { SwitchToSelfManagedDialog } from "./SwitchToSelfManagedDialog";

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

type Props = {
  appId: string;
  rpId: string;
  mode: string;
  productionStatus: RpRegistrationStatus;
  statusContent?: ReactNode;
  variant: "embedded" | "standalone";
  canManageWorldId: boolean;
  onProductionPending: () => void;
  onModeSwitchSuccess?: () => void;
};

export const WorldId40Settings = (props: Props) => {
  const [isRotateOpen, setIsRotateOpen] = useState(false);
  const [isSwitchOpen, setIsSwitchOpen] = useState(false);
  const isActive = props.productionStatus === RpRegistrationStatus.Registered;
  const isSelfManaged = props.mode === "self_managed";
  const isStandalone = props.variant === "standalone";
  const modeLabel = props.mode === "managed" ? "Managed" : "Self-Managed";

  return (
    <div className="flex flex-col gap-y-8">
      <FieldRow label="APP ID (Legacy)" value={props.appId} copy />
      <FieldRow label="RP ID" value={props.rpId} copy />
      <FieldRow label="Management Mode" value={modeLabel} />

      {props.statusContent}

      <div
        className={clsx("flex flex-col gap-4", isStandalone ? "mt-4" : "mt-2")}
      >
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
              disabled={!props.canManageWorldId || !isActive || isSelfManaged}
              className="h-8 rounded-full px-4 py-0 text-xs"
              onClick={() => setIsRotateOpen(true)}
            >
              Reset
            </DecoratedButton>
          </div>
        </div>
      </div>

      <div
        className={clsx(
          "flex flex-col gap-y-6",
          isStandalone ? "mt-4" : "mt-2",
        )}
      >
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
              disabled={!props.canManageWorldId || !isActive || isSelfManaged}
              className={clsx(
                "h-8 shrink-0 rounded-full px-4 text-[13px] font-semibold",
                isStandalone &&
                  props.canManageWorldId &&
                  isActive &&
                  !isSelfManaged
                  ? "bg-danger text-white hover:bg-system-error-700"
                  : undefined,
              )}
              title={
                isStandalone
                  ? !props.canManageWorldId
                    ? "Ask a team owner or admin to change RP settings"
                    : isSelfManaged
                      ? "Already in self-managed mode"
                      : !isActive
                        ? "RP must be active to switch modes"
                        : undefined
                  : undefined
              }
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
        onSuccess={props.onProductionPending}
      />

      <SwitchToSelfManagedDialog
        open={isSwitchOpen}
        onClose={() => setIsSwitchOpen(false)}
        appId={props.appId}
        onSuccess={() => {
          props.onProductionPending();
          props.onModeSwitchSuccess?.();
        }}
      />
    </div>
  );
};
