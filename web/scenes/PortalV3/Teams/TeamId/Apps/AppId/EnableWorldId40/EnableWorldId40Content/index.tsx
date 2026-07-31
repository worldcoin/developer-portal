"use client";

import {
  formDialogPrimaryActionClassName,
  formDialogSecondaryActionClassName,
} from "@/components/FormDialog";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import clsx from "clsx";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { WorldId40OptionCard } from "../WorldId40OptionCard";

export type WorldId40Mode = "managed" | "self-managed";

type FormValues = {
  world_id_4_0_mode: WorldId40Mode;
};

const MANAGED_BULLETS = [
  { text: "Automatic RP registration and updates", variant: "check" as const },
  {
    text: "No wallet needed for on-chain transactions",
    variant: "check" as const,
  },
  {
    text: "You manage your signer key for proof requests",
    variant: "check" as const,
  },
];

const SELF_MANAGED_BULLETS = [
  { text: "Keys can be lost", variant: "x" as const },
  {
    text: "You sign and submit all on-chain transactions",
    variant: "x" as const,
  },
  {
    text: "Not recommended for enterprise or compliance requirements",
    variant: "x" as const,
  },
];

export type EnableWorldId40ContentProps = {
  onContinue: (mode: WorldId40Mode) => void;
  onCancel?: () => void;
  isSelfManagedEnabled: boolean;
  initialMode?: WorldId40Mode;
  isManagedEnabled?: boolean;
  managedDisabledReason?: string;
  loading?: boolean;
  className?: string;
};

export const EnableWorldId40Content = ({
  onContinue,
  onCancel,
  isSelfManagedEnabled,
  initialMode,
  isManagedEnabled = true,
  managedDisabledReason,
  loading,
  className,
}: EnableWorldId40ContentProps) => {
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      world_id_4_0_mode: initialMode ?? "managed",
    },
  });

  useEffect(() => {
    reset({ world_id_4_0_mode: initialMode ?? "managed" });
  }, [initialMode, reset]);

  const onSubmit = (values: FormValues) => {
    onContinue(values.world_id_4_0_mode);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={clsx("grid w-full gap-y-6", className)}
    >
      <p className="font-world text-14 leading-[1.5] text-portal-muted">
        Enable the next generation of World ID with improved privacy,
        multi-device support, and enhanced security.
      </p>

      <div className="grid gap-y-3">
        <WorldId40OptionCard
          register={register("world_id_4_0_mode")}
          option={{ value: "managed", label: "Managed" }}
          subtitle="On-chain management handled by Developer Portal"
          stampText="Recommended"
          disabledStampText="Locked"
          disabledReason={managedDisabledReason}
          bullets={MANAGED_BULLETS}
          testId="managed"
          disabled={!isManagedEnabled}
        />

        <WorldId40OptionCard
          register={register("world_id_4_0_mode")}
          option={{ value: "self-managed", label: "Self-Managed" }}
          subtitle="Full control over all keys and transactions"
          stampText="Advanced"
          disabledStampText="Coming Soon"
          bullets={SELF_MANAGED_BULLETS}
          testId="self-managed"
          disabled={!isSelfManagedEnabled}
        />
      </div>

      <div className="grid w-full gap-3 md:grid-cols-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className={`${formDialogSecondaryActionClassName} order-2 md:order-none`}
          >
            Cancel
          </button>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          data-testid="button-enable-world-id-40-continue"
          className={clsx(
            `${formDialogPrimaryActionClassName} order-1 md:order-none`,
            !onCancel && "md:col-span-2",
          )}
        >
          {loading ? (
            <SpinnerIcon className="size-5 animate-spin" />
          ) : (
            "Continue"
          )}
        </button>
      </div>
    </form>
  );
};
